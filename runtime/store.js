// runtime/store.js
// File-backed shared state store for cross-process communication
// All services read/write through this layer instead of in-memory shared objects

const fs = require('fs');
const path = require('path');

const RUNTIME_DIR = __dirname;
const QUEUE_FILE = path.join(RUNTIME_DIR, 'queue.json');
const PROCESSED_FILE = path.join(RUNTIME_DIR, 'processed-jobs.json');
const FAILED_FILE = path.join(RUNTIME_DIR, 'failed-jobs.json');
const HEALTH_FILE = path.join(RUNTIME_DIR, 'component-health.json');
const LOGS_FILE = path.join(RUNTIME_DIR, 'logs.ndjson');
const SCENARIO_FILE = path.join(RUNTIME_DIR, 'scenario-mode.json');
const DB_FILE = path.join(RUNTIME_DIR, 'db-status.json');

// --- Helpers ---

function readJSON(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function appendNDJSON(filePath, entry) {
  fs.appendFileSync(filePath, JSON.stringify(entry) + '\n', 'utf8');
}

function readNDJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (!content) return [];
    return content.split('\n').map(line => JSON.parse(line));
  } catch {
    return [];
  }
}

// --- Queue ---

function enqueueJob(job) {
  const queue = readJSON(QUEUE_FILE, []);
  queue.push(job);
  writeJSON(QUEUE_FILE, queue);
}

function dequeueJob() {
  const queue = readJSON(QUEUE_FILE, []);
  if (queue.length === 0) return null;
  const job = queue.shift();
  writeJSON(QUEUE_FILE, queue);
  return job;
}

function getQueueDepth() {
  return readJSON(QUEUE_FILE, []).length;
}

// --- Processed / Failed Jobs ---

function markJobProcessed(job) {
  const processed = readJSON(PROCESSED_FILE, []);
  processed.push({ ...job, processed_at: new Date().toISOString() });
  writeJSON(PROCESSED_FILE, processed);
}

function markJobFailed(job, reason) {
  const failed = readJSON(FAILED_FILE, []);
  failed.push({ ...job, failed_at: new Date().toISOString(), reason });
  writeJSON(FAILED_FILE, failed);
}

// --- Component Health ---

function getComponentHealth() {
  return readJSON(HEALTH_FILE, {
    api: 'operational',
    'job-worker': 'operational',
    queue: 'operational',
    database: 'operational'
  });
}

function updateComponentHealth(component, status) {
  const health = getComponentHealth();
  health[component] = status;
  writeJSON(HEALTH_FILE, health);
}

// --- Logs / Events ---

function logEvent(entry) {
  appendNDJSON(LOGS_FILE, entry);
}

function getNewEvents(sinceIndex) {
  const all = readNDJSON(LOGS_FILE);
  return all.slice(sinceIndex);
}

function getEventCount() {
  try {
    const content = fs.readFileSync(LOGS_FILE, 'utf8').trim();
    return content ? content.split('\n').length : 0;
  } catch {
    return 0;
  }
}

// --- Scenario Mode ---

function getScenarioMode() {
  return readJSON(SCENARIO_FILE, { mode: null }).mode;
}

function setScenarioMode(mode) {
  writeJSON(SCENARIO_FILE, { mode, set_at: new Date().toISOString() });
}

// --- DB Status ---

function getDBStatus() {
  return readJSON(DB_FILE, { active_connections: 0, max_connections: 100, recent_errors: 0 });
}

function updateDBStatus(updates) {
  const current = getDBStatus();
  Object.assign(current, updates);
  writeJSON(DB_FILE, current);
}

function getFailedJobsCount() {
  return readJSON(FAILED_FILE, []).length;
}

function getProcessedJobsCount() {
  return readJSON(PROCESSED_FILE, []).length;
}

// --- Reset ---

function resetRuntime() {
  writeJSON(QUEUE_FILE, []);
  writeJSON(PROCESSED_FILE, []);
  writeJSON(FAILED_FILE, []);
  writeJSON(HEALTH_FILE, {
    api: 'operational',
    'job-worker': 'operational',
    queue: 'operational',
    database: 'operational'
  });
  writeJSON(SCENARIO_FILE, { mode: null });
  writeJSON(DB_FILE, { active_connections: 0, max_connections: 100, recent_errors: 0 });
  // Clear logs file
  fs.writeFileSync(LOGS_FILE, '', 'utf8');
  // Clear incidents directory
  const incidentsDir = path.join(RUNTIME_DIR, 'incidents');
  if (fs.existsSync(incidentsDir)) {
    fs.rmSync(incidentsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(incidentsDir, { recursive: true });
}

// --- Initialize if missing ---

function ensureRuntimeFiles() {
  if (!fs.existsSync(QUEUE_FILE)) writeJSON(QUEUE_FILE, []);
  if (!fs.existsSync(PROCESSED_FILE)) writeJSON(PROCESSED_FILE, []);
  if (!fs.existsSync(FAILED_FILE)) writeJSON(FAILED_FILE, []);
  if (!fs.existsSync(HEALTH_FILE)) {
    writeJSON(HEALTH_FILE, {
      api: 'operational',
      'job-worker': 'operational',
      queue: 'operational',
      database: 'operational'
    });
  }
  if (!fs.existsSync(LOGS_FILE)) fs.writeFileSync(LOGS_FILE, '', 'utf8');
  if (!fs.existsSync(SCENARIO_FILE)) writeJSON(SCENARIO_FILE, { mode: null });
  if (!fs.existsSync(DB_FILE)) {
    writeJSON(DB_FILE, { active_connections: 0, max_connections: 100, recent_errors: 0 });
  }
  const incidentsDir = path.join(RUNTIME_DIR, 'incidents');
  if (!fs.existsSync(incidentsDir)) fs.mkdirSync(incidentsDir, { recursive: true });
}

ensureRuntimeFiles();

module.exports = {
  enqueueJob,
  dequeueJob,
  getQueueDepth,
  markJobProcessed,
  markJobFailed,
  getFailedJobsCount,
  getProcessedJobsCount,
  getComponentHealth,
  updateComponentHealth,
  logEvent,
  getNewEvents,
  getEventCount,
  getScenarioMode,
  setScenarioMode,
  getDBStatus,
  updateDBStatus,
  resetRuntime,
  ensureRuntimeFiles
};
