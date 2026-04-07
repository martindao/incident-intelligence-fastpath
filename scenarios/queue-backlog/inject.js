// scenarios/queue-backlog/inject.js
// Simulates queue backlog by flooding the live API with jobs

const http = require('http');

const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3001;
const JOB_COUNT = parseInt(process.env.BACKLOG_COUNT) || 60;

function injectQueueBacklog() {
  console.log(`Setting scenario mode to 'queue-backlog'...`);

  const scenarioData = JSON.stringify({ mode: 'queue-backlog' });
  const scenarioReq = http.request({
    hostname: API_HOST,
    port: API_PORT,
    path: '/api/scenario',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(scenarioData)
    }
  }, (res) => {
    res.on('data', () => {});
    res.on('end', () => {
      console.log(`Scenario mode set. Injecting ${JOB_COUNT} jobs to simulate queue backlog...`);
      let injected = 0;

      function sendNext() {
        if (injected >= JOB_COUNT) {
          console.log(`All ${JOB_COUNT} backlog jobs injected.`);
          console.log('Watch the intelligence core detect queue depth threshold breach.');
          return;
        }

        const job = {
          tenant_id: `tenant_${Math.floor(Math.random() * 5) + 1}`,
          action: 'generate_report',
          report_type: 'monthly_summary',
          priority: 'normal'
        };

        const data = JSON.stringify(job);
        const options = {
          hostname: API_HOST,
          port: API_PORT,
          path: '/api/jobs',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
          }
        };

        const req = http.request(options, (res) => {
          let body = '';
          res.on('data', chunk => { body += chunk; });
          res.on('end', () => {
            injected++;
            if (injected % 10 === 0) {
              console.log(`  Injected ${injected}/${JOB_COUNT} jobs`);
            }
            setTimeout(sendNext, 50);
          });
        });

        req.on('error', (err) => {
          console.error(`  Job ${injected + 1} failed: ${err.message}`);
        });

        req.write(data);
        req.end();
      }

      sendNext();
    });
  });

  scenarioReq.on('error', (err) => {
    console.error(`Failed to set scenario mode: ${err.message}`);
    console.log('Make sure the API server is running (npm run start:app)');
  });

  scenarioReq.write(scenarioData);
  scenarioReq.end();
}

if (require.main === module) {
  injectQueueBacklog();
}

module.exports = { injectQueueBacklog };
