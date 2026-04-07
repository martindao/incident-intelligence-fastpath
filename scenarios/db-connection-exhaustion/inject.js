// scenarios/db-connection-exhaustion/inject.js
// Simulates DB connection exhaustion by flooding the live API with jobs

const http = require('http');

const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3001;
const JOB_COUNT = parseInt(process.env.DB_EXHAUST_COUNT) || 30;

function injectDBExhaustion() {
  console.log(`Setting scenario mode to 'db-exhaustion'...`);

  const scenarioData = JSON.stringify({ mode: 'db-exhaustion' });
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
      console.log(`Scenario mode set. Injecting ${JOB_COUNT} jobs to simulate DB connection exhaustion...`);
      let injected = 0;

      function sendNext() {
        if (injected >= JOB_COUNT) {
          console.log(`All ${JOB_COUNT} DB exhaustion jobs injected.`);
          console.log('Watch the intelligence core detect DB as shared failure origin.');
          return;
        }

        const job = {
          tenant_id: `tenant_${Math.floor(Math.random() * 3) + 1}`,
          action: 'persist_record',
          record_type: 'transaction',
          data: { amount: Math.random() * 1000 }
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
            if (injected % 5 === 0) {
              console.log(`  Injected ${injected}/${JOB_COUNT} jobs`);
            }
            setTimeout(sendNext, 100);
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
  injectDBExhaustion();
}

module.exports = { injectDBExhaustion };
