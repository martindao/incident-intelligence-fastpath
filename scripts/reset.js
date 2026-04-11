// scripts/reset.js
// Full reset: clears runtime state, artifacts, and engine memory
// This is the canonical reset for demo/test cycles

const fs = require('fs');
const path = require('path');
const store = require('../runtime/store');

const ARTIFACTS_DIR = path.join(__dirname, '..', 'artifacts', 'incidents');

console.log('Resetting runtime state...');
store.resetRuntime();

console.log('Clearing artifacts...');
if (fs.existsSync(ARTIFACTS_DIR)) {
  fs.rmSync(ARTIFACTS_DIR, { recursive: true, force: true });
}
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

console.log('Reset complete.');
console.log('Runtime files in: runtime/');
console.log('Artifacts cleared in: artifacts/incidents/');
