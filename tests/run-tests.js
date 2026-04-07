// tests/run-tests.js
// Test suite for the Incident Intelligence Fast-Path Console

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Import modules to test
const { correlateEvents } = require('../intelligence-core/correlation/bucket');
const { promoteIncident } = require('../intelligence-core/promotion/engine');
const { captureEvidence } = require('../intelligence-core/evidence/snapshot');
const { generateTimeline } = require('../intelligence-core/summaries/timeline');
const { generateSummary } = require('../intelligence-core/summaries/summary');
const store = require('../runtime/store');

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

console.log('\n=== Incident Intelligence Fast-Path Console — Tests ===\n');

// Reset runtime before tests
store.resetRuntime();

// --- Correlation Tests ---
console.log('Correlation Engine:');

test('groups events by correlation key + service', () => {
  const events = [
    { id: 'e1', correlation_key: 'job_1', service: 'worker', severity: 'error', timestamp: '2026-01-01T00:00:01Z', message: 'fail', metadata: {}, raw: {} },
    { id: 'e2', correlation_key: 'job_1', service: 'worker', severity: 'error', timestamp: '2026-01-01T00:00:02Z', message: 'fail', metadata: {}, raw: {} },
    { id: 'e3', correlation_key: 'job_2', service: 'worker', severity: 'error', timestamp: '2026-01-01T00:00:03Z', message: 'fail', metadata: {}, raw: {} },
  ];
  const result = correlateEvents(events, {});
  const bucketKeys = Object.keys(result.active);
  assert.strictEqual(bucketKeys.length, 2, 'Should create 2 buckets');
});

test('promotes bucket when threshold reached', () => {
  const events = Array.from({ length: 5 }, (_, i) => ({
    id: `e${i}`, correlation_key: 'job_1', service: 'worker', severity: 'error',
    timestamp: `2026-01-01T00:00:0${i + 1}Z`, message: 'fail', metadata: {}, raw: {}
  }));
  const result = correlateEvents(events, {});
  const promotedKeys = Object.keys(result.promoted);
  assert.strictEqual(promotedKeys.length, 1, 'Should promote 1 bucket');
});

test('does not promote below threshold', () => {
  const events = Array.from({ length: 3 }, (_, i) => ({
    id: `e${i}`, correlation_key: 'job_1', service: 'worker', severity: 'warning',
    timestamp: `2026-01-01T00:00:0${i + 1}Z`, message: 'slow', metadata: {}, raw: {}
  }));
  const result = correlateEvents(events, {});
  const promotedKeys = Object.keys(result.promoted);
  assert.strictEqual(promotedKeys.length, 0, 'Should not promote below threshold');
});

// --- Promotion Tests ---
console.log('\nPromotion Engine:');

test('creates incident with required fields', () => {
  const bucket = {
    key: 'job_1:worker',
    events: [
      { id: 'e1', service: 'worker', severity: 'error', timestamp: '2026-01-01T00:00:01Z', type: 'job_processing_failed', message: 'fail', metadata: {}, raw: {} },
      { id: 'e2', service: 'worker', severity: 'error', timestamp: '2026-01-01T00:00:02Z', type: 'job_processing_failed', message: 'fail', metadata: {}, raw: {} },
    ],
    services: new Set(['worker']),
    severities: new Set(['error'])
  };
  const incident = promoteIncident(bucket);
  assert.ok(incident.id, 'Should have id');
  assert.ok(incident.title, 'Should have title');
  assert.ok(incident.severity, 'Should have severity');
  assert.ok(incident.probable_origin, 'Should have probable_origin');
  assert.ok(incident.correlated_events, 'Should have correlated_events');
  assert.strictEqual(incident.primary_service, 'worker');
});

test('identifies probable origin correctly', () => {
  const bucket = {
    key: 'job_1:worker',
    events: [
      { id: 'e1', service: 'worker', severity: 'error', timestamp: '2026-01-01T00:00:01Z', type: 'job_processing_failed', message: 'fail', metadata: {}, raw: {} },
      { id: 'e2', service: 'api', severity: 'warning', timestamp: '2026-01-01T00:00:02Z', type: 'delayed', message: 'slow', metadata: {}, raw: {} },
    ],
    services: new Set(['worker', 'api']),
    severities: new Set(['error', 'warning'])
  };
  const incident = promoteIncident(bucket);
  assert.strictEqual(incident.probable_origin.service, 'worker', 'Worker should be origin (earliest error)');
});

// --- Evidence Snapshot Tests ---
console.log('\nEvidence Snapshot:');

test('captures evidence with required fields from runtime store', () => {
  // Set up runtime store with test data
  store.resetRuntime();
  store.setScenarioMode('poison-pill');
  store.updateComponentHealth('job-worker', 'degraded');
  store.updateComponentHealth('queue', 'degraded');
  store.updateDBStatus({ active_connections: 45, max_connections: 100 });

  // Add some test events
  for (let i = 0; i < 5; i++) {
    store.logEvent({
      id: `evt_test_${i}`,
      timestamp: new Date().toISOString(),
      service: 'worker',
      severity: 'error',
      message: 'test failure'
    });
  }

  const incident = { id: 'inc_test_001', correlated_events: ['evt_test_0', 'evt_test_1'], opened_at: new Date().toISOString() };
  const evidence = captureEvidence(incident);

  assert.ok(evidence.checksum, 'Should have checksum');
  assert.strictEqual(evidence.scenario_id, 'poison-pill');
  assert.ok(evidence.component_health['job-worker'] === 'degraded');
  assert.ok(evidence.recent_logs.length > 0, 'Should have recent logs');
});

// --- Timeline Tests ---
console.log('\nTimeline Generation:');

test('generates chronological timeline', () => {
  const bucket = {
    events: [
      { id: 'e1', service: 'worker', severity: 'error', timestamp: '2026-01-01T00:00:01Z', type: 'job_processing_failed', message: 'fail 1', metadata: {}, raw: {} },
      { id: 'e2', service: 'worker', severity: 'error', timestamp: '2026-01-01T00:00:02Z', type: 'job_processing_failed', message: 'fail 2', metadata: {}, raw: {} },
    ],
    services: new Set(['worker']),
    severities: new Set(['error'])
  };
  const incident = { id: 'inc_001', primary_service: 'worker', severity: 'P1', title: 'Test', opened_at: '2026-01-01T00:00:03Z', runbook_ref: 'runbooks/test.md' };
  const timeline = generateTimeline(bucket, incident);
  assert.ok(timeline.length > 0, 'Should have timeline entries');
  // Verify chronological order
  for (let i = 1; i < timeline.length; i++) {
    assert.ok(new Date(timeline[i].timestamp) >= new Date(timeline[i - 1].timestamp), 'Should be chronological');
  }
});

// --- Summary Tests ---
console.log('\nSummary Generation:');

test('generates markdown summary with required sections', () => {
  const incident = { id: 'inc_001', title: 'Test Incident', severity: 'P1', status: 'open', primary_service: 'worker', affected_components: ['worker', 'queue'], probable_origin: { service: 'worker', confidence: 0.85, reason: 'test' }, opened_at: '2026-01-01T00:00:00Z', correlated_events: ['e1', 'e2'], runbook_ref: 'runbooks/test.md' };
  const evidence = { queue_depth: 50, failed_jobs_count: 5, processed_jobs_count: 10, db_status: { active_connections: 45, max_connections: 100 }, component_health: { worker: 'degraded' } };
  const timeline = [{ timestamp: '2026-01-01T00:00:01Z', severity: 'error', service: 'worker', message: 'fail' }];
  const summary = generateSummary(incident, evidence, timeline);
  assert.ok(summary.includes('Test Incident'), 'Should include title');
  assert.ok(summary.includes('P1'), 'Should include severity');
  assert.ok(summary.includes('What Happened'), 'Should include What Happened section');
  assert.ok(summary.includes('Evidence Captured'), 'Should include Evidence section');
  assert.ok(summary.includes('Recommended Next Actions'), 'Should include Next Actions section');
  assert.ok(summary.includes('runbooks/test.md'), 'Should include runbook link');
});

// --- Runtime Store Tests ---
console.log('\nRuntime Store:');

test('enqueue and dequeue jobs correctly', () => {
  store.resetRuntime();
  store.enqueueJob({ id: 'job_1', payload: { test: true } });
  store.enqueueJob({ id: 'job_2', payload: { test: true } });
  assert.strictEqual(store.getQueueDepth(), 2, 'Queue depth should be 2');

  const job1 = store.dequeueJob();
  assert.strictEqual(job1.id, 'job_1', 'Should dequeue first job');
  assert.strictEqual(store.getQueueDepth(), 1, 'Queue depth should be 1 after dequeue');
});

test('component health updates persist', () => {
  store.resetRuntime();
  store.updateComponentHealth('database', 'degraded');
  const health = store.getComponentHealth();
  assert.strictEqual(health.database, 'degraded', 'Database should be degraded');
  assert.strictEqual(health.api, 'operational', 'API should still be operational');
});

test('scenario mode persists across calls', () => {
  store.resetRuntime();
  store.setScenarioMode('poison-pill');
  assert.strictEqual(store.getScenarioMode(), 'poison-pill', 'Scenario mode should be poison-pill');
});

// --- Results ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
  process.exit(1);
}
