// Simple test runner - runs JS files in the scripts/tests folder
const fs = require('fs');
const { spawnSync } = require('child_process');

const testsDir = __dirname + '/tests';
if (!fs.existsSync(testsDir)) {
  console.log('No tests found in scripts/tests');
  process.exit(0);
}

const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.js'));
if (files.length === 0) {
  console.log('No test files found.');
  process.exit(0);
}

let fail = false;
files.forEach(file => {
  console.log(`\nRunning ${file}`);
  const result = spawnSync(process.execPath, [testsDir + '/' + file], { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`${file} failed with exit code ${result.status}`);
    fail = true;
  }
});
if (fail) process.exit(1);
