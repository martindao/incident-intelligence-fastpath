// tests/integration.js
// Full-system integration test for the Incident Intelligence Fast-Path Console
// Tests the complete flow: API → Queue → Worker → Intelligence Core → Artifacts
// Uses the shared runtime store directly (no HTTP server required)

const fs = require('fs');
const path = require('path');
const store = require('../runtime/store');
const { processJob } = require('../app-under-test/worker');
const { processEvents, resetEngine } = require('../intelligence-core/engine');

const ARTIFACTS_DIR = path.join(__dirname, '..', 'artifacts', 'incidents');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

function resetSystem() {
  store.resetRuntime();
  resetEngine();
  if (fs.existsSync(ARTIFACTS_DIR)) {
    fs.rmSync(ARTIFACTS_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function runIntegrationTests() {
  console.log('\n=== Integration Tests — Full System ===\n');

  // --- Test 1: Poison-pill scenario end-to-end ---
  console.log('Scenario 1: Poison-Pill Job Payload');
  resetSystem();

  // Set scenario mode (simulates API /api/scenario call)
  store.setScenarioMode('poison-pill');

  // Simulate API enqueuing poison-pill jobs
  for (let i = 0; i < 8; i++) {
    const jobId = `job_poison_${i}`;
    store.enqueueJob({
      id: jobId,
      payload: { _poison: true, tenant_id: `tenant_${i}`, action: 'process_payment', amount: 99.99 },
      status: 'pending',
      created_at: new Date().toISOString(),
      trace_id: `trace_${i}`
    });

    // API logs the enqueue event
    store.logEvent({
      id: `evt_api_${i}`,
      timestamp: new Date(Date.now() + i * 100).toISOString(),
      source: 'api',
      service: 'api',
      severity: 'info',
      type: 'job_enqueued',
      correlation_key: jobId,
      message: `Job ${jobId} enqueued`,
      metadata: { job_id: jobId, tenant_id: `tenant_${i}` },
      raw: {}
    });
  }

  // Simulate worker processing all jobs
  for (let i = 0; i < 8; i++) {
    const job = store.dequeueJob();
    if (job) processJob(job);
  }

  // Simulate intelligence core processing all events
  const poisonEvents = store.getNewEvents(0);
  processEvents(poisonEvents);

  // Verify artifacts were created
  const poisonIncidentDirs = fs.readdirSync(ARTIFACTS_DIR);
  test('promotes at least one incident from poison-pill scenario', () => {
    if (poisonIncidentDirs.length === 0) throw new Error('No incidents promoted');
  });

  if (poisonIncidentDirs.length > 0) {
    const incidentId = poisonIncidentDirs[0];
    const incidentPath = path.join(ARTIFACTS_DIR, incidentId, 'incident.json');
    const evidencePath = path.join(ARTIFACTS_DIR, incidentId, 'evidence-bundle.json');
    const timelinePath = path.join(ARTIFACTS_DIR, incidentId, 'timeline.json');
    const summaryPath = path.join(ARTIFACTS_DIR, incidentId, 'summary.md');

    test('incident.json has worker as probable origin', () => {
      const incident = JSON.parse(fs.readFileSync(incidentPath, 'utf8'));
      if (incident.probable_origin.service !== 'job-worker') {
        throw new Error(`Expected job-worker origin, got ${incident.probable_origin.service}`);
      }
    });

    test('evidence-bundle.json has valid checksum', () => {
      const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
      if (!evidence.checksum || !evidence.checksum.startsWith('sha256:')) {
        throw new Error('Missing or invalid checksum');
      }
    });

    test('timeline.json is chronological with multiple entries', () => {
      const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));
      if (timeline.length < 3) throw new Error(`Expected 3+ timeline entries, got ${timeline.length}`);
      for (let i = 1; i < timeline.length; i++) {
        if (new Date(timeline[i].timestamp) < new Date(timeline[i - 1].timestamp)) {
          throw new Error('Timeline is not chronological');
        }
      }
    });

    test('summary.md contains all required sections', () => {
      const summary = fs.readFileSync(summaryPath, 'utf8');
      const requiredSections = ['What Happened', 'Evidence Captured', 'Recommended Next Actions', 'runbooks/poison-pill-job.md'];
      for (const section of requiredSections) {
        if (!summary.includes(section)) throw new Error(`Missing section: ${section}`);
      }
    });
  }

  // --- Test 2: Queue backlog scenario ---
  console.log('\nScenario 2: Queue Backlog');
  resetSystem();
  store.setScenarioMode('queue-backlog');

  // Enqueue many jobs to create backlog
  for (let i = 0; i < 60; i++) {
    store.enqueueJob({
      id: `job_backlog_${i}`,
      payload: { tenant_id: `tenant_${i % 5}`, action: 'generate_report' },
      status: 'pending',
      created_at: new Date().toISOString(),
      trace_id: `trace_backlog_${i}`
    });
  }

  // Process some jobs slowly (simulating backlog)
  for (let i = 0; i < 10; i++) {
    const job = store.dequeueJob();
    if (job) processJob(job);
  }

  // Verify queue depth is high
  const queueDepth = store.getQueueDepth();
  test('queue depth exceeds threshold after backlog injection', () => {
    if (queueDepth < 50) throw new Error(`Queue depth ${queueDepth} should be >= 50`);
  });

  // Add queue depth warning events
  for (let i = 0; i < 5; i++) {
    store.logEvent({
      id: `evt_qdepth_${i}`,
      timestamp: new Date(Date.now() + i * 500).toISOString(),
      source: 'worker',
      service: 'queue',
      severity: 'warning',
      type: 'queue_depth_high',
      correlation_key: 'queue_system',
      message: `Queue depth is ${queueDepth}, threshold exceeded`,
      metadata: { queue_depth: queueDepth },
      raw: {}
    });
  }

  // Add worker delay events
  for (let i = 0; i < 3; i++) {
    store.logEvent({
      id: `evt_delay_${i}`,
      timestamp: new Date(Date.now() + (i + 5) * 500).toISOString(),
      source: 'worker',
      service: 'job-worker',
      severity: 'warning',
      type: 'job_processing_delayed',
      correlation_key: 'queue_system',
      message: `Job processing delayed`,
      metadata: { delay_ms: 1500 },
      raw: {}
    });
  }

  // Process events through intelligence core
  const backlogEvents = store.getNewEvents(0);
  processEvents(backlogEvents);

  const backlogIncidentDirs = fs.readdirSync(ARTIFACTS_DIR);
  test('promotes incident from queue backlog scenario', () => {
    if (backlogIncidentDirs.length === 0) throw new Error('No backlog incident promoted');
  });

  // --- Test 3: DB exhaustion scenario ---
  console.log('\nScenario 3: DB Connection Exhaustion');
  resetSystem();
  store.setScenarioMode('db-exhaustion');
  store.updateDBStatus({ active_connections: 85, max_connections: 100 });
  store.updateComponentHealth('database', 'degraded');

  // Simulate DB errors from multiple services
  for (let i = 0; i < 3; i++) {
    store.logEvent({
      id: `evt_db_err_${i}`,
      timestamp: new Date(Date.now() + i * 1000).toISOString(),
      source: 'worker',
      service: 'database',
      severity: 'error',
      type: 'db_connection_error',
      correlation_key: 'db_shared',
      message: `Too many database connections (${85 + i}/100)`,
      metadata: { db_connections: 85 + i },
      raw: {}
    });
  }

  store.logEvent({
    id: 'evt_api_db_err',
    timestamp: new Date(Date.now() + 3000).toISOString(),
    source: 'api',
    service: 'api',
    severity: 'error',
    type: 'db_connection_error',
    correlation_key: 'db_shared',
    message: 'API write failed: connection timeout',
    metadata: {},
    raw: {}
  });

  // Process events
  const dbEvents = store.getNewEvents(0);
  processEvents(dbEvents);

  const dbIncidentDirs = fs.readdirSync(ARTIFACTS_DIR);
  test('promotes incident from DB exhaustion scenario', () => {
    if (dbIncidentDirs.length === 0) throw new Error('No DB exhaustion incident promoted');
  });

  if (dbIncidentDirs.length > 0) {
    const dbIncidentId = dbIncidentDirs[0];
    const dbIncidentPath = path.join(ARTIFACTS_DIR, dbIncidentId, 'incident.json');
    test('DB incident identifies database as affected component', () => {
      const incident = JSON.parse(fs.readFileSync(dbIncidentPath, 'utf8'));
      if (!incident.affected_components.includes('database')) {
        throw new Error('Database not listed as affected component');
      }
    });
    test('DB incident has P1 or P2 severity', () => {
      const incident = JSON.parse(fs.readFileSync(dbIncidentPath, 'utf8'));
      if (!['P1', 'P2'].includes(incident.severity)) {
        throw new Error(`Expected P1 or P2 severity, got ${incident.severity}`);
      }
    });
  }

  // --- Test 4: Cross-process state consistency ---
  console.log('\nCross-Process State Consistency');

  resetSystem();
  store.setScenarioMode('poison-pill');
  store.updateComponentHealth('queue', 'degraded');
  store.enqueueJob({ id: 'test_job_1', payload: {}, status: 'pending' });

  test('scenario mode persists across store calls', () => {
    if (store.getScenarioMode() !== 'poison-pill') throw new Error('Scenario mode not persisted');
  });

  test('component health persists across store calls', () => {
    const health = store.getComponentHealth();
    if (health.queue !== 'degraded') throw new Error('Component health not persisted');
  });

  test('queue depth reflects actual enqueued jobs', () => {
    if (store.getQueueDepth() !== 1) throw new Error(`Expected queue depth 1, got ${store.getQueueDepth()}`);
  });

  test('events are appended to shared log store', () => {
    store.logEvent({ id: 'evt_test_log', timestamp: new Date().toISOString(), service: 'test', severity: 'info', message: 'test' });
    const events = store.getNewEvents(0);
    if (events.length === 0) throw new Error('No events in shared log store');
  });

  // --- Results ---
  console.log(`\n=== Integration Results: ${passed} passed, ${failed} failed ===\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runIntegrationTests().catch(err => {
  console.error('Integration test runner failed:', err);
  process.exit(1);
});
