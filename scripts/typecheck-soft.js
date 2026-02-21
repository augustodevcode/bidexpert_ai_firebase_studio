/* 
 * Soft typecheck gate: runs tsc and always exits 0.
 * Emits a clear message when errors are present.
 */
const { spawnSync } = require('child_process');

const result = spawnSync('npx', ['tsc', '-p', 'tsconfig.dev.json', '--noEmit'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  console.log('[typecheck:soft] Type errors detected (non-blocking). Check the full CI log for details.');
}

process.exit(0);
