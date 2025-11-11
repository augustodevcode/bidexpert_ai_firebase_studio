#!/usr/bin/env node

/**
 * Script para iniciar a aplicação BidExpert na porta 9005 com monitoramento de logs
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Criar arquivo de log
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, `bidexpert-9005-${new Date().toISOString().split('T')[0]}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

console.log(`\n🚀 Iniciando BidExpert na porta 9005...`);
console.log(`📝 Logs sendo registrados em: ${logFile}\n`);

logStream.write(`\n${'='.repeat(80)}\n`);
logStream.write(`[${new Date().toISOString()}] BidExpert iniciado na porta 9005\n`);
logStream.write(`${'='.repeat(80)}\n\n`);

// Executar npm run dev:9005
const devProcess = spawn('npm', ['run', 'dev:9005'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  cwd: path.join(__dirname, '..')
});

// Processar stdout
devProcess.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  logStream.write(`[STDOUT] ${output}`);

  // Detectar mensagens importantes
  if (output.includes('ready on')) {
    console.log(`\n✅ Aplicação pronta em http://localhost:9005\n`);
  }
  if (output.includes('compiled client')) {
    console.log(`✨ Cliente compilado com sucesso\n`);
  }
  if (output.includes('error')) {
    console.log(`⚠️  Erro detectado\n`);
  }
});

// Processar stderr
devProcess.stderr.on('data', (data) => {
  const output = data.toString();
  process.stderr.write(output);
  logStream.write(`[STDERR] ${output}`);
});

// Processar término
devProcess.on('close', (code) => {
  const message = `\n[${new Date().toISOString()}] Processo encerrado com código ${code}\n`;
  console.log(message);
  logStream.write(message);
  logStream.end();
  process.exit(code);
});

// Processar sinais
process.on('SIGINT', () => {
  console.log('\n\n🛑 Recebido SIGINT, encerrando...\n');
  logStream.write(`\n[${new Date().toISOString()}] Processo interrompido pelo usuário\n`);
  devProcess.kill('SIGINT');
  logStream.end();
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Recebido SIGTERM, encerrando...\n');
  logStream.write(`\n[${new Date().toISOString()}] Processo terminado\n`);
  devProcess.kill('SIGTERM');
  logStream.end();
});
