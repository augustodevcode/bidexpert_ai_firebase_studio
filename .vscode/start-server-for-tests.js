#!/usr/bin/env node

/**
 * SCRIPT: Rodar servidor para testes E2E
 * 
 * Características:
 * - Roda servidor PRÉ-COMPILADO (sem lazy compilation)
 * - Desativa hot-reload (mais estável)
 * - Otimizado para testes
 * - Aguarda até estar pronto antes de sair
 * 
 * Execução: node .vscode/start-server-for-tests.js
 */

const { spawn } = require('child_process');
const http = require('http');

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║     🚀 INICIANDO SERVIDOR OTIMIZADO PARA TESTES              ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Verificar se existe build
const fs = require('fs');
if (!fs.existsSync('.next')) {
  console.error('❌ Erro: Build não encontrado!');
  console.error('   Execute primeiro: npm run build\n');
  process.exit(1);
}

console.log('📦 Usando build pré-compilado\n');
console.log('🔄 Iniciando servidor (Next.js production mode)...\n');

// Inicia servidor em modo production (sem hot-reload)
const server = spawn('npm', ['run', 'start'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '9002'
  }
});

// Aguarda 5 segundos e testa conectividade
setTimeout(() => {
  testConnection();
}, 5000);

function testConnection() {
  const req = http.get('http://localhost:9002', (res) => {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                  ✅ SERVIDOR PRONTO                            ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\n📍 Servidor rodando em: http://localhost:9002');
    console.log('📊 Modo: Production (sem hot-reload)');
    console.log('\n🎬 Quando pronto, execute em outro terminal:');
    console.log('   npx playwright test tests/e2e/qa-comprehensive-validation.spec.ts --headed\n');
  });

  req.on('error', () => {
    setTimeout(testConnection, 1000); // Tenta novamente
  });
}

server.on('error', (error) => {
  console.error('❌ Erro ao iniciar servidor:', error.message);
  process.exit(1);
});
