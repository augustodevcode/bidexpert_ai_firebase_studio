const { spawn } = require('child_process');

let run_preview;
try {
  ({ run_preview } = require('@qoder/ide-api'));
} catch (error) {
  console.warn('[start-preview] @qoder/ide-api não encontrado; use a pré-visualização manualmente.');
  run_preview = ({ name, url }) => {
    console.log(`Preview de "${name}" não pôde ser iniciado automaticamente. Acesse ${url} na aba Preview do VS Code.`);
  };
}

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