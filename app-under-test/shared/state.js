// app-under-test/shared/state.js
// Shared state module simulating queue + DB for the app-under-test

const state = {
  queue: [],
  processedJobs: [],
  failedJobs: [],
  dbConnections: { active: 0, max: 100 },
  componentHealth: {
    api: 'operational',
    'job-worker': 'operational',
    queue: 'operational',
    database: 'operational'
  },
  logs: [],
  scenarioMode: null // 'poison-pill', 'queue-backlog', 'db-exhaustion', or null
};

function logEntry(source, service, severity, type, message, metadata = {}) {
  const entry = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    source,
    service,
    severity,
    type,
    correlation_key: metadata.job_id || metadata.trace_id || 'system',
    message,
    metadata,
    raw: {}
  };
  state.logs.push(entry);
  return entry;
}

function updateComponentHealth(component, status) {
  state.componentHealth[component] = status;
}

function getQueueDepth() {
  return state.queue.length;
}

function getActiveConnections() {
  return state.dbConnections.active;
}

module.exports = { state, logEntry, updateComponentHealth, getQueueDepth, getActiveConnections };
