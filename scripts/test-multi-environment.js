/**
 * Script para iniciar múltiplos ambientes BidExpert simultaneamente
 * Cada ambiente roda em uma porta diferente com seu próprio tenant slug
 * 
 * Ambientes:
 * - DEV:  porta 9005, slug: dev
 * - HML:  porta 9006, slug: hml
 * - DEMO: porta 9007, slug: demo
 * - PROD: porta 9008, slug: prod (apenas para teste local)
 */

const { spawn } = require('child_process');
const http = require('http');

const environments = [
  { name: 'DEV', port: 9005, slug: 'dev', db: 'bidexpert_dev' },
  { name: 'HML', port: 9006, slug: 'hml', db: 'bidexpert_hml' },
  { name: 'DEMO', port: 9007, slug: 'demo', db: 'bidexpert_demo' },
  { name: 'PROD', port: 9008, slug: 'prod', db: 'bidexpert_prod' },
];

const processes = [];
const results = [];

async function checkPort(port) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/',
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      resolve({ status: res.statusCode, ok: res.statusCode < 400 || res.statusCode === 302 });
    });

    req.on('error', () => resolve({ status: 0, ok: false }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, ok: false });
    });

    req.end();
  });
}

async function waitForServer(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await checkPort(port);
    if (result.ok) return true;
    await new Promise(r => setTimeout(r, 2000));
  }
  return false;
}

async function startEnvironment(env) {
  console.log(`\n🚀 Iniciando ambiente ${env.name} na porta ${env.port}...`);
  
  const childEnv = {
    ...process.env,
    PORT: String(env.port),
    TENANT_SLUG: env.slug,
    NODE_ENV: env.name === 'PROD' ? 'production' : 'development',
    DATABASE_URL: `mysql://root:M%21nh%40S3nha2025@localhost:3306/${env.db}`,
  };

  const child = spawn('npm', ['run', 'dev'], {
    env: childEnv,
    shell: true,
    stdio: 'pipe',
    cwd: process.cwd(),
  });

  processes.push({ name: env.name, process: child, port: env.port });

  child.stdout.on('data', (data) => {
    const line = data.toString();
    if (line.includes('Ready') || line.includes('started')) {
      console.log(`✅ ${env.name}: Servidor pronto na porta ${env.port}`);
    }
  });

  child.stderr.on('data', (data) => {
    const line = data.toString();
    if (line.includes('EADDRINUSE')) {
      console.log(`⚠️  ${env.name}: Porta ${env.port} já em uso`);
    }
  });

  return child;
}

async function testAllEnvironments() {
  console.log('\n📊 Testando todos os ambientes...\n');
  console.log('='.repeat(60));
  
  for (const env of environments) {
    const url = `http://${env.slug}.localhost:${env.port}`;
    const result = await checkPort(env.port);
    
    const status = result.ok ? '✅ OK' : '❌ FALHA';
    const httpStatus = result.status || 'N/A';
    
    console.log(`| ${env.name.padEnd(6)} | ${url.padEnd(30)} | ${status} | HTTP: ${httpStatus} |`);
    
    results.push({
      environment: env.name,
      url: url,
      port: env.port,
      slug: env.slug,
      status: result.ok ? 'OK' : 'FAILED',
      httpStatus: result.status,
    });
  }
  
  console.log('='.repeat(60));
  return results;
}

async function main() {
  console.log('🐳 BidExpert Multi-Environment Test');
  console.log('====================================\n');
  
  // Verificar portas em uso
  console.log('Verificando portas disponíveis...');
  for (const env of environments) {
    const result = await checkPort(env.port);
    if (result.ok) {
      console.log(`⚠️  Porta ${env.port} (${env.name}) já está em uso`);
    } else {
      console.log(`✓ Porta ${env.port} (${env.name}) disponível`);
    }
  }

  // Testar ambientes existentes
  console.log('\n📋 Testando ambientes já em execução...');
  const testResults = await testAllEnvironments();
  
  // Gerar relatório
  const report = {
    timestamp: new Date().toISOString(),
    environments: testResults,
    summary: {
      total: testResults.length,
      success: testResults.filter(r => r.status === 'OK').length,
      failed: testResults.filter(r => r.status === 'FAILED').length,
    },
  };
  
  console.log('\n📄 Relatório Final:');
  console.log(JSON.stringify(report, null, 2));
  
  // Salvar relatório
  const fs = require('fs');
  fs.writeFileSync(
    'multi-environment-test-report.json',
    JSON.stringify(report, null, 2)
  );
  console.log('\n💾 Relatório salvo em: multi-environment-test-report.json');
}

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando todos os processos...');
  processes.forEach(p => {
    p.process.kill('SIGTERM');
  });
  process.exit(0);
});

main().catch(console.error);
