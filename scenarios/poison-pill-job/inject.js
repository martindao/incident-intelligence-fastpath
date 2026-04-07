// scenarios/poison-pill-job/inject.js
// Injects malformed job payloads via the live API to simulate poison-pill scenario

const http = require('http');

const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3001;
const JOB_COUNT = parseInt(process.env.POISON_COUNT) || 10;

function injectPoisonPill() {
  console.log(`Setting scenario mode to 'poison-pill'...`);

  // Set scenario mode via API
  const scenarioData = JSON.stringify({ mode: 'poison-pill' });
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
      console.log(`Scenario mode set. Injecting ${JOB_COUNT} poison-pill jobs...`);
      let injected = 0;

      function sendNext() {
        if (injected >= JOB_COUNT) {
          console.log(`All ${JOB_COUNT} poison-pill jobs injected.`);
          console.log('Watch the intelligence core correlate and promote an incident.');
          return;
        }

        const job = {
          _poison: true,
          tenant_id: `tenant_${Math.floor(Math.random() * 10) + 1}`,
          action: 'process_payment',
          amount: 99.99,
          malformed_field: null
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
            console.log(`  Job ${injected}/${JOB_COUNT}: ${res.statusCode}`);
            setTimeout(sendNext, 200);
          });
        });

        req.on('error', (err) => {
          console.error(`  Job ${injected + 1} failed: ${err.message}`);
          console.log('Make sure the API server is running (npm run start:app)');
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
  injectPoisonPill();
}

module.exports = { injectPoisonPill };
