// support-console/server.js
// Support-facing web console for incident browsing and live simulation

const http = require('http');
const fs = require('fs');
const path = require('path');
const store = require('../runtime/store');
const { processEvents, resetEngine } = require('../intelligence-core/engine');

const PORT = process.env.CONSOLE_PORT || 3003;
const ARTIFACTS_DIR = path.join(__dirname, '..', 'artifacts', 'incidents');
const RUNBOOKS_DIR = path.join(__dirname, '..', 'runbooks');

function getIncidentList() {
  if (!fs.existsSync(ARTIFACTS_DIR)) return [];
  const incidents = [];
  const dirs = fs.readdirSync(ARTIFACTS_DIR);
  for (const dir of dirs) {
    const incidentPath = path.join(ARTIFACTS_DIR, dir, 'incident.json');
    if (fs.existsSync(incidentPath)) {
      try {
        const incident = JSON.parse(fs.readFileSync(incidentPath, 'utf8'));
        incidents.push(incident);
      } catch (e) {
        // Skip malformed incident files
      }
    }
  }
  return incidents.sort((a, b) => new Date(b.opened_at) - new Date(a.opened_at));
}

function serveFile(res, filePath, contentType) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(content);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'File not found' }));
  }
}

// --- Simulation Endpoints ---

function simulatePoisonPill(res) {
  try {
    store.setScenarioMode('poison-pill');
    for (let i = 0; i < 10; i++) {
      const jobId = `job_poison_${i}`;
      store.enqueueJob({ id: jobId, payload: { _poison: true, tenant_id: `tenant_${i}`, action: 'process_payment', amount: 99.99 }, status: 'pending', created_at: new Date().toISOString(), trace_id: `trace_${i}` });
      store.logEvent({ id: `evt_api_${i}`, timestamp: new Date(Date.now() + i * 100).toISOString(), source: 'api', service: 'api', severity: 'info', type: 'job_enqueued', correlation_key: jobId, message: `Job ${jobId} enqueued`, metadata: { job_id: jobId, tenant_id: `tenant_${i}` }, raw: {} });
    }
    for (let i = 0; i < 10; i++) {
      const job = store.dequeueJob();
      if (job) {
        store.logEvent({ id: `evt_worker_${i}`, timestamp: new Date(Date.now() + 1000 + i * 100).toISOString(), source: 'worker', service: 'job-worker', severity: 'error', type: 'job_processing_failed', correlation_key: job.id, message: `Job ${job.id} failed: invalid payload schema`, metadata: { job_id: job.id, tenant_id: job.payload?.tenant_id || 'unknown' }, raw: {} });
        store.markJobFailed(job, 'invalid_payload');
      }
    }
    store.updateComponentHealth('job-worker', 'degraded');
    setTimeout(() => processEvents(store.getNewEvents(0)), 200);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, scenario: 'poison-pill' }));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

function simulateQueueBacklog(res) {
  try {
    store.setScenarioMode('queue-backlog');
    for (let i = 0; i < 60; i++) {
      store.enqueueJob({ id: `job_backlog_${i}`, payload: { tenant_id: `tenant_${i % 5}`, action: 'generate_report' }, status: 'pending', created_at: new Date().toISOString(), trace_id: `trace_backlog_${i}` });
    }
    for (let i = 0; i < 10; i++) {
      const job = store.dequeueJob();
      if (job) {
        store.logEvent({ id: `evt_delay_${i}`, timestamp: new Date(Date.now() + i * 500).toISOString(), source: 'worker', service: 'job-worker', severity: 'warning', type: 'job_processing_delayed', correlation_key: job.id, message: `Job ${job.id} processing delayed`, metadata: { delay_ms: 1500 }, raw: {} });
      }
    }
    for (let i = 0; i < 5; i++) {
      store.logEvent({ id: `evt_qdepth_${i}`, timestamp: new Date(Date.now() + (i + 5) * 500).toISOString(), source: 'worker', service: 'queue', severity: 'warning', type: 'queue_depth_high', correlation_key: 'queue_system', message: `Queue depth is ${store.getQueueDepth()}, threshold exceeded`, metadata: { queue_depth: store.getQueueDepth() }, raw: {} });
    }
    store.updateComponentHealth('queue', 'degraded');
    store.updateComponentHealth('job-worker', 'degraded');
    setTimeout(() => processEvents(store.getNewEvents(0)), 200);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, scenario: 'queue-backlog' }));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

function simulateDBExhaustion(res) {
  try {
    store.setScenarioMode('db-exhaustion');
    store.updateDBStatus({ active_connections: 85, max_connections: 100 });
    store.updateComponentHealth('database', 'degraded');
    for (let i = 0; i < 3; i++) {
      store.logEvent({ id: `evt_db_err_${i}`, timestamp: new Date(Date.now() + i * 1000).toISOString(), source: 'worker', service: 'database', severity: 'error', type: 'db_connection_error', correlation_key: 'db_shared', message: `Too many database connections (${85 + i}/100)`, metadata: { db_connections: 85 + i }, raw: {} });
    }
    store.logEvent({ id: 'evt_api_db_err', timestamp: new Date(Date.now() + 3000).toISOString(), source: 'api', service: 'api', severity: 'error', type: 'db_connection_error', correlation_key: 'db_shared', message: 'API write failed: connection timeout', metadata: {}, raw: {} });
    setTimeout(() => processEvents(store.getNewEvents(0)), 200);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, scenario: 'db-exhaustion' }));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

  function resetConsole(res) {
  try {
    store.resetRuntime();
    resetEngine();
    if (fs.existsSync(ARTIFACTS_DIR)) fs.rmSync(ARTIFACTS_DIR, { recursive: true, force: true });
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.url === '/api/incidents') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getIncidentList()));
  } else if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(store.getComponentHealth()));
  } else if (req.url === '/' || req.url === '/index.html') {
    serveFile(res, path.join(__dirname, 'ui', 'index.html'), 'text/html');
  } else if (req.url.startsWith('/api/incidents/')) {
    const parts = req.url.split('/');
    const incidentId = parts[3];
    const fileType = parts[4];
    if (!incidentId || !fileType) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing incident ID or file type' }));
      return;
    }
    const fileMap = { 'incident.json': 'incident.json', 'timeline.json': 'timeline.json', 'evidence-bundle.json': 'evidence-bundle.json', 'summary.md': 'summary.md' };
    const fileName = fileMap[fileType];
    if (!fileName) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unknown artifact type' }));
      return;
    }
    const filePath = path.join(ARTIFACTS_DIR, incidentId, fileName);
    const contentType = fileName.endsWith('.md') ? 'text/markdown' : 'application/json';
    serveFile(res, filePath, contentType);
  } else if (req.url.startsWith('/runbooks/')) {
    const runbookName = req.url.split('/').pop();
    const filePath = path.join(RUNBOOKS_DIR, runbookName);
    serveFile(res, filePath, 'text/markdown');
  } else if (req.method === 'POST' && req.url === '/api/simulate/poison-pill') {
    simulatePoisonPill(res);
  } else if (req.method === 'POST' && req.url === '/api/simulate/queue-backlog') {
    simulateQueueBacklog(res);
  } else if (req.method === 'POST' && req.url === '/api/simulate/db-exhaustion') {
    simulateDBExhaustion(res);
  } else if (req.method === 'POST' && req.url === '/api/reset') {
    resetConsole(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Support console running on http://localhost:${PORT}`);
});

module.exports = server;
