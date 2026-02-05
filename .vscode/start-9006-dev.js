/**
 * @file start-9006-dev.js
 * @description Script para iniciar BidExpert no ambiente DEV (porta 9006)
 * 
 * Uso: node .vscode/start-9006-dev.js
 * 
 * Este script é usado por agentes AI quando o usuário está usando
 * o ambiente DEMO na porta 9005.
 */

const { spawn } = require('child_process');
const path = require('path');

const PORT = 9006;
const DATABASE_URL = 'mysql://root:M%21nh%40S3nha2025@localhost:3306/bidexpert_dev';
const NODE_ENV = 'development';

console.log('');
console.log('============================================================');
console.log('  BidExpert DEV - Porta', PORT);
console.log('============================================================');
console.log('');
console.log('📋 Configuração:');
console.log(`   PORT: ${PORT}`);
console.log(`   DATABASE: bidexpert_dev (MySQL)`);
console.log(`   NODE_ENV: ${NODE_ENV}`);
console.log('');
console.log('🔗 URL: http://dev.localhost:' + PORT);
console.log('');
console.log('============================================================');
console.log('');

// Configurar variáveis de ambiente
const env = {
  ...process.env,
  PORT: PORT.toString(),
  DATABASE_URL: DATABASE_URL,
  NODE_ENV: NODE_ENV,
  NEXT_PUBLIC_TENANT_SLUG: 'dev'
};

// Iniciar Next.js
const next = spawn('npx', ['next', 'dev', '-p', PORT.toString()], {
  cwd: path.resolve(__dirname, '..'),
  env: env,
  stdio: 'inherit',
  shell: true
});

next.on('error', (err) => {
  console.error('❌ Erro ao iniciar:', err);
  process.exit(1);
});

next.on('close', (code) => {
  console.log(`\nProcesso encerrado com código: ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nEncerrando servidor...');
  next.kill('SIGINT');
});

process.on('SIGTERM', () => {
  next.kill('SIGTERM');
});
