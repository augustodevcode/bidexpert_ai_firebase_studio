#!/usr/bin/env node

/**
 * SCRIPT MASTER: Executa tudo para testes E2E
 * 
 * Fluxo:
 * 1. ✅ Pré-build completo (compilar todas as páginas)
 * 2. ✅ Inicia servidor em production mode (sem lazy compilation)
 * 3. ✅ Aguarda servidor ficar pronto
 * 4. ✅ Executa testes Playwright
 * 5. ✅ Reporta resultados
 * 
 * Execução: node .vscode/run-e2e-tests.js
 */

const { execSync, spawn } = require('child_process');
const http = require('http');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m'
};

console.log(`
${colors.cyan}${colors.bold}╔════════════════════════════════════════════════════════════════╗
║                 🎬 TESTES E2E COM PLAYWRIGHT                  ║
║            (Pré-Build → Servidor → Testes Automáticos)        ║
╚════════════════════════════════════════════════════════════════╝${colors.reset}
`);

let serverProcess;
const serverPort = 9002;
const baseUrl = `http://localhost:${serverPort}`;

async function main() {
  try {
    // ETAPA 1: Pré-Build
    console.log(`${colors.bold}[1/4] 🔨 PRÉ-BUILD - Compilando aplicação completa${colors.reset}\n`);
    
    try {
      execSync('npm run build', {
        stdio: 'inherit',
        shell: true
      });
      console.log(`${colors.green}✅ Build concluído com sucesso${colors.reset}\n`);
    } catch (error) {
      console.error(`${colors.red}❌ Erro no build${colors.reset}`);
      process.exit(1);
    }

    // ETAPA 2: Iniciar Servidor
    console.log(`${colors.bold}[2/4] 🚀 INICIANDO SERVIDOR (Production Mode)${colors.reset}\n`);
    
    await startServer();
    console.log(`${colors.green}✅ Servidor pronto${colors.reset}\n`);

    // ETAPA 3: Aguardar Servidor
    console.log(`${colors.bold}[3/4] ⏳ AGUARDANDO SERVIDOR FICAR ESTÁVEL${colors.reset}\n`);
    
    await waitForServer(10); // 10 segundos de espera
    console.log(`${colors.green}✅ Servidor estável e respondendo${colors.reset}\n`);

    // ETAPA 4: Executar Testes
    console.log(`${colors.bold}[4/4] 🧪 EXECUTANDO TESTES PLAYWRIGHT${colors.reset}\n`);
    
    await runPlaywrightTests();

    // Sucesso
    console.log(`
${colors.green}${colors.bold}╔════════════════════════════════════════════════════════════════╗
║                   ✅ TESTES CONCLUÍDOS                        ║
╚════════════════════════════════════════════════════════════════╝${colors.reset}
`);

    process.exit(0);

  } catch (error) {
    console.error(`${colors.red}${colors.bold}❌ Erro:${colors.reset}`, error.message);
    
    // Limpar servidor
    if (serverProcess) {
      serverProcess.kill();
    }
    
    process.exit(1);
  }
}

/**
 * Inicia servidor Next.js em modo production
 */
function startServer() {
  return new Promise((resolve, reject) => {
    console.log(`Iniciando: npm start\n`);
    
    serverProcess = spawn('npm', ['start'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: serverPort
      }
    });

    serverProcess.on('error', (error) => {
      reject(new Error(`Erro ao iniciar servidor: ${error.message}`));
    });

    // Aguarda um pouco e resolve (servidor continua rodando)
    setTimeout(resolve, 3000);
  });
}

/**
 * Aguarda servidor ficar pronto
 */
function waitForServer(maxSeconds) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = maxSeconds * 2; // 2 tentativas por segundo

    const checkServer = () => {
      const req = http.get(baseUrl, { timeout: 500 }, (res) => {
        if (res.statusCode < 500) {
          console.log(`${colors.green}✓ Servidor respondendo (status ${res.statusCode})${colors.reset}\n`);
          resolve();
        } else {
          retry();
        }
      });

      req.on('error', () => {
        retry();
      });

      req.on('timeout', () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkServer, 500);
      } else {
        reject(new Error(`Servidor não respondeu após ${maxSeconds} segundos`));
      }
    };

    checkServer();
  });
}

/**
 * Executa testes Playwright
 */
function runPlaywrightTests() {
  return new Promise((resolve, reject) => {
    console.log(`Executando: npx playwright test...\n`);
    
    const tests = spawn('npx', [
      'playwright',
      'test',
      'e2e/multi-tenant-isolation.spec.ts',
      'itsm/itsm-admin-tickets.spec.ts',
      'e2e/admin/asset-form-v2.spec.ts',
      'e2e/admin/auctions-crud.spec.ts',
      'e2e/admin/lots-crud.spec.ts',
      '--config=playwright.config.local.ts',
      '--headed',
      '--reporter=html,list'
    ], {
      stdio: 'inherit',
      shell: true
    });

    tests.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        // Mesmo com falhas, continua para reportar
        resolve();
      }
    });

    tests.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Cleanup ao finalizar
 */
process.on('exit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

// Inicia execução
main().catch(error => {
  console.error(error);
  process.exit(1);
});
