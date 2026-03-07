/*
 * Soft security-audit gate: runs npm audit and always exits 0.
 * Emits a clear message when vulnerabilities are present.
 */
const { spawnSync } = require('child_process');

const result = spawnSync('npm', ['audit', '--audit-level=high'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  console.log('[audit:soft] Security vulnerabilities detected (non-blocking). Check the full CI log for details.');
}

process.exit(0);
