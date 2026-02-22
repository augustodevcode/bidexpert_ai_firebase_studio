/**
 * @file start-9007-dev.js
 * @description Script para iniciar BidExpert no ambiente DEV (porta 9007).
 *
 * Usado quando portas 9005 (demo user) e 9006 (dev agent) estão ocupadas.
 * Ideal para desenvolvimento e testes da Biblioteca de Mídia em isolamento.
 *
 * Pré-requisito: container MySQL rodando na porta 3307
 *   docker compose -f docker-compose.media-dev.yml up -d
 *
 * Uso:
 *   node .vscode/start-9007-dev.js
 *
 * Acesso: http://dev.localhost:9007/admin/media
 *
 * Storage:
 *   Sem BLOB_READ_WRITE_TOKEN → LocalStorageAdapter (public/uploads/)
 *   Com BLOB_READ_WRITE_TOKEN → VercelBlobAdapter com prefixo 'dev/'
 */

const { spawn } = require('child_process');

const PORT = 9007;
const DATABASE_URL = 'mysql://root:password@localhost:3307/bidexpert_dev';
const NODE_ENV = 'development';

console.log('');
console.log('============================================================');
console.log('  BidExpert MEDIA DEV - Porta', PORT);
console.log('============================================================');
console.log('');
console.log('  PORT:', PORT);
console.log('  DATABASE: bidexpert_dev (MySQL local:3307)');
console.log('  NODE_ENV:', NODE_ENV);
console.log('  STORAGE:', process.env.BLOB_READ_WRITE_TOKEN ? 'Vercel Blob' : 'Local filesystem');
console.log('');
console.log('  URL: http://dev.localhost:' + PORT);
console.log('  Media: http://dev.localhost:' + PORT + '/admin/media');
console.log('============================================================');
console.log('');

const env = {
  ...process.env,
  PORT: String(PORT),
  DATABASE_URL,
  NODE_ENV,
  NEXTAUTH_URL: `http://dev.localhost:${PORT}`,
};

const server = spawn('npx', ['next', 'dev', '--port', String(PORT)], {
  env,
  stdio: 'inherit',
  shell: true,
});

server.on('error', (err) => {
  console.error('[start-9007-dev] Erro ao iniciar servidor:', err.message);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log('[start-9007-dev] Servidor encerrado com código:', code);
});

process.on('SIGINT', () => {
  server.kill('SIGINT');
});
