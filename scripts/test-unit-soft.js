/*
 * Soft unit-test gate: runs unit tests and always exits 0.
 * Emits a clear message when failures are present.
 */
const { spawnSync } = require('child_process');

const result = spawnSync('npm', ['run', 'test:unit'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  console.log('[test:unit:soft] Unit test failures detected (non-blocking). Check the full CI log for details.');
}

process.exit(0);
