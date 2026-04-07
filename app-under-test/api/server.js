// app-under-test/api/server.js
// Simulated API service that receives requests and enqueues jobs via shared runtime store

const http = require('http');
const store = require('../../runtime/store');

const PORT = process.env.API_PORT || 3001;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'POST' && req.url === '/api/jobs') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const job = JSON.parse(body);
        const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const traceId = `trace_${Math.random().toString(36).slice(2, 10)}`;

        store.enqueueJob({
          id: jobId,
          payload: job,
          status: 'pending',
          created_at: new Date().toISOString(),
          trace_id: traceId
        });

        store.logEvent({
          id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
          source: 'api',
          service: 'api',
          severity: 'info',
          type: 'job_enqueued',
          correlation_key: jobId,
          message: `Job ${jobId} enqueued`,
          metadata: { job_id: jobId, trace_id, tenant_id: job.tenant_id || 'unknown' },
          raw: {}
        });

        res.writeHead(202);
        res.end(JSON.stringify({ id: jobId, status: 'accepted', trace_id: traceId }));
      } catch (err) {
        store.logEvent({
          id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
          source: 'api',
          service: 'api',
          severity: 'error',
          type: 'job_parse_failed',
          correlation_key: 'system',
          message: `Failed to parse job payload: ${err.message}`,
          metadata: {},
          raw: {}
        });
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      queue_depth: store.getQueueDepth(),
      components: store.getComponentHealth()
    }));
  } else if (req.method === 'GET' && req.url === '/api/logs') {
    const all = store.getNewEvents(0);
    res.writeHead(200);
    res.end(JSON.stringify(all.slice(-100)));
  } else if (req.method === 'POST' && req.url === '/api/scenario') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { mode } = JSON.parse(body);
        store.setScenarioMode(mode);
        res.writeHead(200);
        res.end(JSON.stringify({ mode }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  store.logEvent({
    id: `evt_${Date.now()}_api_start`,
    timestamp: new Date().toISOString(),
    source: 'api',
    service: 'api',
    severity: 'info',
    type: 'api_started',
    correlation_key: 'system',
    message: `API server started on port ${PORT}`,
    metadata: {},
    raw: {}
  });
  console.log(`API server running on port ${PORT}`);
});

module.exports = server;
