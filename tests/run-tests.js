// tests/run-tests.js
// Test suite for the Incident Intelligence Fast-Path Console

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Import modules to test
const { correlateEvents } = require('../intelligence-core/correlation/bucket');
const { promoteIncident, isCloudPatternIncident, mapToAwsService, generateAwsContext, generateDependencyNotes, generateCloudServiceRationale } = require('../intelligence-core/promotion/engine');
const { captureEvidence, buildAwsContext, generateDependencyNotes: buildDependencyNotes, calculateBlastRadius } = require('../intelligence-core/evidence/snapshot');
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

// --- AWS Context Mapping Tests ---
console.log('\nAWS Context Mapping:');

test('isCloudPatternIncident detects cloud-pattern events', () => {
  const cloudEvents = [
    { id: 'e1', type: 'db_connection_error', service: 'database', severity: 'error', timestamp: '2026-01-01T00:00:01Z', message: 'fail', metadata: {}, raw: {} },
    { id: 'e2', type: 'queue_depth_high', service: 'queue', severity: 'warning', timestamp: '2026-01-01T00:00:02Z', message: 'high', metadata: {}, raw: {} }
  ];
  const nonCloudEvents = [
    { id: 'e1', type: 'job_processing_failed', service: 'worker', severity: 'error', timestamp: '2026-01-01T00:00:01Z', message: 'fail', metadata: {}, raw: {} }
  ];
  
  assert.strictEqual(isCloudPatternIncident(cloudEvents), true, 'Should detect cloud-pattern events');
  assert.strictEqual(isCloudPatternIncident(nonCloudEvents), false, 'Should not detect non-cloud events');
});

test('mapToAwsService maps services correctly', () => {
  const dbMapping = mapToAwsService('database');
  assert.strictEqual(dbMapping.service, 'RDS', 'Database should map to RDS');
  assert.ok(dbMapping.arnPrefix.includes('rds'), 'Should have RDS ARN prefix');
  
  const queueMapping = mapToAwsService('queue');
  assert.strictEqual(queueMapping.service, 'SQS', 'Queue should map to SQS');
  
  const workerMapping = mapToAwsService('worker');
  assert.strictEqual(workerMapping.service, 'Lambda', 'Worker should map to Lambda');
  
  const unknownMapping = mapToAwsService('unknown-service');
  assert.strictEqual(unknownMapping.service, 'EC2', 'Unknown service should default to EC2');
});

test('generateAwsContext creates valid AWS context structure', () => {
  const bucket = {
    key: 'test:database',
    events: [
      { id: 'e1', type: 'db_connection_error', service: 'database', severity: 'error', timestamp: '2026-01-01T00:00:01Z', message: 'fail', metadata: {}, raw: {} }
    ],
    services: new Set(['database']),
    severities: new Set(['error'])
  };
  const probableOrigin = { service: 'database', confidence: 0.85, reason: 'test' };
  
  const awsContext = generateAwsContext(bucket, probableOrigin);
  
  assert.ok(awsContext, 'Should return AWS context for cloud-pattern incident');
  assert.strictEqual(awsContext.account_id, '123456789012', 'Should have account_id');
  assert.strictEqual(awsContext.region, 'us-east-1', 'Should have region');
  assert.ok(Array.isArray(awsContext.impacted_services), 'Should have impacted_services array');
  assert.ok(Array.isArray(awsContext.blast_radius), 'Should have blast_radius array');
  assert.ok(awsContext.event_type_code, 'Should have event_type_code');
  assert.ok(awsContext.dependency_notes, 'Should have dependency_notes');
  assert.ok(awsContext.routing_artifact_ref, 'Should have routing_artifact_ref');
});

test('generateAwsContext returns null for non-cloud incidents', () => {
  const bucket = {
    key: 'test:worker',
    events: [
      { id: 'e1', type: 'job_processing_failed', service: 'worker', severity: 'error', timestamp: '2026-01-01T00:00:01Z', message: 'fail', metadata: {}, raw: {} }
    ],
    services: new Set(['worker']),
    severities: new Set(['error'])
  };
  const probableOrigin = { service: 'worker', confidence: 0.85, reason: 'test' };
  
  const awsContext = generateAwsContext(bucket, probableOrigin);
  assert.strictEqual(awsContext, null, 'Should return null for non-cloud incidents');
});

test('generateCloudServiceRationale enhances probable origin', () => {
  const bucket = {
    key: 'test:database',
    events: [
      { id: 'e1', type: 'db_connection_error', service: 'database', severity: 'error', timestamp: '2026-01-01T00:00:01Z', message: 'fail', metadata: {}, raw: {} },
      { id: 'e2', type: 'db_connection_error', service: 'database', severity: 'error', timestamp: '2026-01-01T00:00:02Z', message: 'fail', metadata: {}, raw: {} }
    ],
    services: new Set(['database']),
    severities: new Set(['error'])
  };
  const baseOrigin = { service: 'database', confidence: 0.85, reason: 'earliest repeated failure' };
  
  const enhancedOrigin = generateCloudServiceRationale(bucket, baseOrigin);
  
  assert.ok(enhancedOrigin.reason.includes('Cloud-service analysis'), 'Should include cloud-service analysis');
  assert.ok(enhancedOrigin.reason.includes('RDS'), 'Should mention AWS service');
});

test('generateDependencyNotes produces meaningful notes', () => {
  const dbNotes = generateDependencyNotes(['database', 'worker'], 'db_connection_error');
  assert.ok(dbNotes.includes('Database connection exhaustion'), 'Should mention connection exhaustion');
  assert.ok(dbNotes.includes('RDS'), 'Should mention RDS');
  
  const queueNotes = generateDependencyNotes(['queue', 'worker'], 'queue_depth_high');
  assert.ok(queueNotes.includes('Queue backlog'), 'Should mention queue backlog');
  assert.ok(queueNotes.includes('SQS'), 'Should mention SQS');
  
  const jobNotes = generateDependencyNotes(['worker'], 'job_processing_failed');
  assert.ok(jobNotes.includes('Job processing failures'), 'Should mention job failures');
  assert.ok(jobNotes.includes('Lambda'), 'Should mention Lambda');
});

// --- AWS Evidence Context Tests ---
console.log('\nAWS Evidence Context:');

test('buildAwsContext creates valid structure', () => {
  const incident = { id: 'inc_test', correlated_events: ['e1'] };
  const componentHealth = { 'database': 'degraded', 'api': 'operational', 'queue': 'degraded' };
  
  const awsContext = buildAwsContext(incident, componentHealth, 'db-exhaustion');
  
  assert.strictEqual(awsContext.account_id, '123456789012', 'Should have account_id');
  assert.strictEqual(awsContext.region, 'us-east-1', 'Should have region');
  assert.ok(Array.isArray(awsContext.services), 'Should have services array');
  assert.ok(Array.isArray(awsContext.blast_radius), 'Should have blast_radius array');
  assert.strictEqual(awsContext.event_type_code, 'AWS_RDS_CONNECTION_EXHAUSTION', 'Should have correct event type code');
  
  // Verify degraded services are in blast radius
  assert.ok(awsContext.blast_radius.length >= 2, 'Should have at least 2 degraded services in blast radius');
});

test('generateDependencyNotes produces meaningful notes from evidence', () => {
  const incident = { id: 'inc_test', correlated_events: ['e1'] };
  const degradedHealth = { 'database': 'degraded', 'api': 'degraded' };
  const operationalHealth = { 'database': 'operational', 'api': 'operational' };
  
  const degradedNotes = buildDependencyNotes(incident, degradedHealth);
  assert.ok(degradedNotes.includes('Cloud service dependencies impacted'), 'Should mention impacted dependencies');
  assert.ok(degradedNotes.includes('RDS') || degradedNotes.includes('ALB'), 'Should mention AWS service names');
  
  const operationalNotes = buildDependencyNotes(incident, operationalHealth);
  assert.ok(operationalNotes.includes('All cloud services operational'), 'Should indicate all operational');
});

test('calculateBlastRadius returns correct ARNs', () => {
  const incident = { id: 'inc_test', correlated_events: ['e1'] };
  const componentHealth = { 'database': 'degraded', 'api': 'operational', 'queue': 'degraded' };
  
  const blastRadius = calculateBlastRadius(incident, componentHealth);
  
  assert.ok(Array.isArray(blastRadius), 'Should return an array');
  assert.strictEqual(blastRadius.length, 2, 'Should have 2 degraded components');
  
  // Verify ARNs are present
  const hasRdsArn = blastRadius.some(arn => arn.includes('rds'));
  const hasSqsArn = blastRadius.some(arn => arn.includes('sqs'));
  assert.ok(hasRdsArn, 'Should include RDS ARN');
  assert.ok(hasSqsArn, 'Should include SQS ARN');
  
  // Verify operational service is NOT in blast radius
  const hasAlbArn = blastRadius.some(arn => arn.includes('elasticloadbalancing'));
  assert.ok(!hasAlbArn, 'Should NOT include ALB ARN (operational)');
});

// --- Backward Compatibility Tests ---
console.log('\nBackward Compatibility:');

test('incidents without AWS context still work', () => {
  const bucket = {
    key: 'job_1:worker',
    events: [
      { id: 'e1', service: 'worker', severity: 'error', timestamp: '2026-01-01T00:00:01Z', type: 'job_processing_failed', message: 'fail', metadata: {}, raw: {} },
      { id: 'e2', service: 'worker', severity: 'error', timestamp: '2026-01-01T00:00:02Z', type: 'job_processing_failed', message: 'fail', metadata: {}, raw: {} }
    ],
    services: new Set(['worker']),
    severities: new Set(['error'])
  };
  
  const incident = promoteIncident(bucket);
  
  // Should have all required fields
  assert.ok(incident.id, 'Should have id');
  assert.ok(incident.title, 'Should have title');
  assert.ok(incident.severity, 'Should have severity');
  assert.ok(incident.probable_origin, 'Should have probable_origin');
  assert.ok(incident.correlated_events, 'Should have correlated_events');
  
  // Should NOT have aws_context for non-cloud incidents
  assert.ok(!incident.aws_context, 'Should not have aws_context for non-cloud incidents');
});

test('cloud incidents include AWS context in promoted incident', () => {
  const bucket = {
    key: 'db_1:database',
    events: [
      { id: 'e1', service: 'database', severity: 'error', timestamp: '2026-01-01T00:00:01Z', type: 'db_connection_error', message: 'connection failed', metadata: {}, raw: {} },
      { id: 'e2', service: 'database', severity: 'error', timestamp: '2026-01-01T00:00:02Z', type: 'db_connection_error', message: 'connection failed', metadata: {}, raw: {} }
    ],
    services: new Set(['database']),
    severities: new Set(['error'])
  };
  
  const incident = promoteIncident(bucket);
  
  // Should have aws_context for cloud incidents
  assert.ok(incident.aws_context, 'Should have aws_context for cloud incidents');
  assert.ok(incident.aws_context.impacted_services, 'Should have impacted_services');
  assert.ok(incident.aws_context.blast_radius, 'Should have blast_radius');
  assert.ok(incident.probable_origin.reason.includes('Cloud-service analysis'), 'Should have enhanced rationale');
});

test('evidence capture works with and without AWS context', () => {
  store.resetRuntime();
  store.setScenarioMode('poison-pill');
  store.updateComponentHealth('job-worker', 'degraded');
  
  // Incident without aws_context field
  const incidentNoAws = { id: 'inc_test_001', correlated_events: ['evt_test_0'], opened_at: new Date().toISOString() };
  const evidenceNoAws = captureEvidence(incidentNoAws);
  
  assert.ok(evidenceNoAws.checksum, 'Should have checksum');
  assert.ok(evidenceNoAws.aws_context, 'Evidence should always have aws_context from component health');
  
  // Incident with aws_context field
  const incidentWithAws = { 
    id: 'inc_test_002', 
    correlated_events: ['evt_test_1'], 
    opened_at: new Date().toISOString(),
    aws_context: { account_id: '123456789012', region: 'us-east-1' }
  };
  const evidenceWithAws = captureEvidence(incidentWithAws);
  
  assert.ok(evidenceWithAws.checksum, 'Should have checksum');
  assert.ok(evidenceWithAws.aws_context, 'Should have aws_context');
});

// --- Results ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
  process.exit(1);
}
