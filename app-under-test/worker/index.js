// app-under-test/worker/index.js
// Simulated worker that processes jobs from the shared runtime store

const store = require('../../runtime/store');

const PROCESS_INTERVAL = parseInt(process.env.WORKER_INTERVAL) || 1000;

function processJob(job) {
  const traceId = job.trace_id;
  const scenarioMode = store.getScenarioMode();

  // Scenario 1: Poison-pill detection
  if (scenarioMode === 'poison-pill' && job.payload && job.payload._poison === true) {
    store.logEvent({
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      source: 'worker',
      service: 'job-worker',
      severity: 'error',
      type: 'job_processing_failed',
      correlation_key: job.id,
      message: `Job ${job.id} failed: invalid payload schema`,
      metadata: { job_id: job.id, trace_id: traceId, tenant_id: job.payload?.tenant_id || 'unknown' },
      raw: {}
    });
    store.markJobFailed(job, 'invalid_payload');
    return false;
  }

  // Scenario 2: Queue backlog / slow processing
  if (scenarioMode === 'queue-backlog') {
    const delay = Math.random() * 2000 + 500;
    store.logEvent({
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      source: 'worker',
      service: 'job-worker',
      severity: 'warning',
      type: 'job_processing_delayed',
      correlation_key: job.id,
      message: `Job ${job.id} processing delayed (${Math.round(delay)}ms)`,
      metadata: { job_id: job.id, trace_id: traceId, delay_ms: Math.round(delay) },
      raw: {}
    });
  }

  // Scenario 3: DB connection exhaustion
  if (scenarioMode === 'db-exhaustion') {
    const dbStatus = store.getDBStatus();
    const newActive = Math.min(dbStatus.active_connections + 1, dbStatus.max_connections);
    store.updateDBStatus({ active_connections: newActive });

    if (newActive >= dbStatus.max_connections * 0.8) {
      store.updateComponentHealth('database', 'degraded');
      store.logEvent({
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        source: 'worker',
        service: 'job-worker',
        severity: 'error',
        type: 'db_connection_error',
        correlation_key: 'db_shared',
        message: `Job ${job.id} failed: too many database connections (${newActive}/${dbStatus.max_connections})`,
        metadata: { job_id: job.id, trace_id: traceId, db_connections: newActive },
        raw: {}
      });
      store.markJobFailed(job, 'db_connection_exhaustion');
      return false;
    }
  }

  // Normal processing
  job.status = 'completed';
  job.completed_at = new Date().toISOString();
  store.markJobProcessed(job);

  store.logEvent({
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    source: 'worker',
    service: 'job-worker',
    severity: 'info',
    type: 'job_completed',
    correlation_key: job.id,
    message: `Job ${job.id} completed successfully`,
    metadata: { job_id: job.id, trace_id: traceId },
    raw: {}
  });

  return true;
}

function workerLoop() {
  const job = store.dequeueJob();
  if (!job) return;

  const success = processJob(job);

  if (!success && store.getScenarioMode() !== 'poison-pill') {
    store.enqueueJob(job);
  }

  // Update queue health
  const depth = store.getQueueDepth();
  if (depth > 50) {
    store.updateComponentHealth('queue', 'degraded');
    store.logEvent({
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      source: 'worker',
      service: 'queue',
      severity: 'warning',
      type: 'queue_depth_high',
      correlation_key: 'queue_system',
      message: `Queue depth is ${depth}, threshold exceeded`,
      metadata: { queue_depth: depth },
      raw: {}
    });
  } else if (depth <= 10) {
    const health = store.getComponentHealth();
    if (health.queue === 'degraded') {
      store.updateComponentHealth('queue', 'operational');
    }
  }
}

setInterval(workerLoop, PROCESS_INTERVAL);

store.logEvent({
  id: `evt_${Date.now()}_worker_start`,
  timestamp: new Date().toISOString(),
  source: 'worker',
  service: 'job-worker',
  severity: 'info',
  type: 'worker_started',
  correlation_key: 'system',
  message: 'Worker started',
  metadata: {},
  raw: {}
});

console.log('Worker started');

module.exports = { processJob, workerLoop };
