#!/usr/bin/env node

/**
 * Script para testar o Wizard de Criação de Leilões
 * 
 * Execução: node .vscode/test-wizard.js
 */

const { execSync, spawn } = require('child_process');
const http = require('http');

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
║                 🧙 WIZARD E2E TESTS                            ║
║            (Build → Server → Wizard Tests)                     ║
╚════════════════════════════════════════════════════════════════╝${colors.reset}
`);

let serverProcess;
const serverPort = 9002;
const baseUrl = `http://localhost:${serverPort}`;

async function main() {
  try {
    // Check if server is already running
    console.log(`${colors.bold}[1/3] 🔍 CHECKING IF SERVER IS RUNNING${colors.reset}\n`);
    
    const serverRunning = await checkServerOnce();
    
    if (!serverRunning) {
      console.log(`${colors.yellow}Server not running. Starting build and server...${colors.reset}\n`);
      
      // Build
      console.log(`${colors.bold}[2/3] 🔨 BUILDING APPLICATION${colors.reset}\n`);
      try {
        execSync('npm run build', {
          stdio: 'inherit',
          shell: true
        });
        console.log(`${colors.green}✅ Build completed${colors.reset}\n`);
      } catch (error) {
        console.error(`${colors.red}❌ Build error${colors.reset}`);
        process.exit(1);
      }

      // Start server
      console.log(`${colors.bold}[2/3] 🚀 STARTING SERVER${colors.reset}\n`);
      await startServer();
      await waitForServer(30);
      console.log(`${colors.green}✅ Server ready${colors.reset}\n`);
    } else {
      console.log(`${colors.green}✅ Server already running${colors.reset}\n`);
    }

    // Run wizard tests
    console.log(`${colors.bold}[3/3] 🧪 RUNNING WIZARD TESTS${colors.reset}\n`);
    
    const testProcess = spawn('npx', [
      'playwright',
      'test',
      'tests/e2e/admin/wizard-complete.spec.ts',
      '--config=playwright.config.local.ts',
      '--headed',
      '--reporter=list'
    ], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        PLAYWRIGHT_SKIP_WEBSERVER: '1',
        BASE_URL: baseUrl
      }
    });

    testProcess.on('exit', (code) => {
      if (serverProcess) {
        serverProcess.kill();
      }
      console.log(`
${code === 0 ? colors.green : colors.red}${colors.bold}╔════════════════════════════════════════════════════════════════╗
║                   ${code === 0 ? '✅ TESTS PASSED' : '❌ TESTS FAILED'}                           ║
╚════════════════════════════════════════════════════════════════╝${colors.reset}
`);
      process.exit(code);
    });

  } catch (error) {
    console.error(`${colors.red}${colors.bold}❌ Error:${colors.reset}`, error.message);
    if (serverProcess) {
      serverProcess.kill();
    }
    process.exit(1);
  }
}

function checkServerOnce() {
  return new Promise((resolve) => {
    const req = http.get(baseUrl, { timeout: 2000 }, (res) => {
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
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
      reject(new Error(`Server start error: ${error.message}`));
    });

    setTimeout(resolve, 3000);
  });
}

function waitForServer(maxSeconds) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = maxSeconds * 2;

    const checkServer = () => {
      const req = http.get(baseUrl, { timeout: 500 }, (res) => {
        if (res.statusCode < 500) {
          resolve();
        } else {
          retry();
        }
      });
      req.on('error', retry);
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
        reject(new Error(`Server did not respond after ${maxSeconds} seconds`));
      }
    };

    checkServer();
  });
}

process.on('exit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

main().catch(error => {
  console.error(error);
  process.exit(1);
});
