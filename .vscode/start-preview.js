const { spawn } = require('child_process');
const { run_preview } = require('@qoder/ide-api');

// Start the development server
const devServer = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

console.log('Starting BidExpert development server...');

// After a short delay, open the preview
setTimeout(() => {
  run_preview({
    name: 'BidExpert App',
    url: 'http://localhost:9002'
  });
}, 5000); // Wait 5 seconds for the server to start

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down development server...');
  devServer.kill();
  process.exit(0);
});