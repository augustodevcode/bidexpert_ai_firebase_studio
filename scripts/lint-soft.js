/*
 * Soft lint gate: runs eslint and always exits 0.
 * Emits a clear message when issues are present.
 */
const { spawnSync } = require('child_process');

const result = spawnSync('npx', ['eslint', '.'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  console.log('[lint:soft] Lint issues detected (non-blocking). Check the full CI log for details.');
}

process.exit(0);
