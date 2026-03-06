/**
 * @fileoverview Script de execução do loop autônomo de testes Playwright.
 * 
 * Este script é invocado pelo Copilot Agent para:
 * 1. Rodar a suíte de testes (ou um teste específico)
 * 2. Persistir output em test-output.log para leitura estática
 * 3. Parsear resultados JSON do Playwright
 * 4. Emitir relatório estruturado para o agente consumir
 *
 * USO:
 *   node scripts/autofix/run-tests.mjs                          # Roda todos
 *   node scripts/autofix/run-tests.mjs tests/e2e/smoke.spec.ts  # Roda específico
 *   node scripts/autofix/run-tests.mjs --grep "login"           # Filtra por nome
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const LOG_FILE = 'test-output.log';
const RESULTS_JSON = 'test-results/results.json';

/** Parse CLI args */
const args = process.argv.slice(2);
let testFile = '';
let grep = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--grep' && args[i + 1]) {
    grep = args[i + 1];
    i++;
  } else if (!args[i].startsWith('--')) {
    testFile = args[i];
  }
}

/** Build Playwright command */
function buildCommand() {
  const parts = [
    'npx', 'playwright', 'test',
    '--config=playwright.autofix.config.ts',
  ];

  if (testFile) {
    parts.push(testFile);
  }

  if (grep) {
    parts.push('-g', `"${grep}"`);
  }

  return parts.join(' ');
}

/** Run tests and capture output */
function runTests() {
  const cmd = buildCommand();
  console.log(`[AUTOFIX_LOOP] Executando: ${cmd}`);
  console.log(`[AUTOFIX_LOOP] Output será salvo em: ${LOG_FILE}`);

  let exitCode = 0;
  let stdout = '';

  try {
    stdout = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 300_000, // 5 minutos max
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        FORCE_COLOR: '0', // Sem ANSI codes para parsing limpo
        PLAYWRIGHT_SKIP_WEBSERVER: '1',
      },
    });
  } catch (err) {
    exitCode = err.status || 1;
    stdout = err.stdout?.toString() || '';
    const stderr = err.stderr?.toString() || '';
    stdout += '\n' + stderr;
  }

  // Persistir em arquivo (fallback de leitura estática para o agente)
  try {
    fs.writeFileSync(LOG_FILE, stdout, 'utf-8');
  } catch (writeErr) {
    console.error('[AUTOFIX_LOOP] Falha ao gravar log:', writeErr.message);
  }

  return { exitCode, stdout };
}

/** Parse JSON results para relatório estruturado */
function parseResults() {
  try {
    if (!fs.existsSync(RESULTS_JSON)) {
      return null;
    }
    const raw = fs.readFileSync(RESULTS_JSON, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Emitir relatório compacto para o agente */
function emitReport(exitCode, results) {
  console.log('\n' + '═'.repeat(60));
  console.log('[AUTOFIX_REPORT]');
  console.log('═'.repeat(60));

  if (!results) {
    console.log(`EXIT_CODE: ${exitCode}`);
    console.log('RESULTS_JSON: não disponível');
    console.log(`LOG_FILE: ${path.resolve(LOG_FILE)}`);
    console.log('═'.repeat(60));
    return exitCode;
  }

  const suites = results.suites || [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const failedTests = [];

  function walkSpecs(specs) {
    for (const spec of specs) {
      for (const test of spec.tests || []) {
        for (const result of test.results || []) {
          if (result.status === 'passed') passed++;
          else if (result.status === 'skipped') skipped++;
          else {
            failed++;
            failedTests.push({
              title: spec.title,
              file: spec.file,
              line: spec.line,
              error: result.error?.message?.slice(0, 300) || 'unknown',
            });
          }
        }
      }
    }
  }

  function walkSuites(suiteList) {
    for (const suite of suiteList) {
      walkSpecs(suite.specs || []);
      walkSuites(suite.suites || []);
    }
  }

  walkSuites(suites);

  const total = passed + failed + skipped;
  console.log(`EXIT_CODE: ${exitCode}`);
  console.log(`TOTAL: ${total}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`SKIPPED: ${skipped}`);
  console.log(`SUCCESS_RATE: ${total > 0 ? Math.round((passed / total) * 100) : 0}%`);

  if (failedTests.length > 0) {
    console.log('\n[FAILED_TESTS_TO_FIX]');
    failedTests.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.title}`);
      console.log(`     FILE: ${f.file}:${f.line}`);
      console.log(`     ERROR: ${f.error}`);
    });
  }

  console.log(`\nLOG_FILE: ${path.resolve(LOG_FILE)}`);
  console.log('═'.repeat(60));

  return exitCode;
}

// ─── Main ───
const { exitCode, stdout } = runTests();
const results = parseResults();
const finalCode = emitReport(exitCode, results);
process.exit(finalCode);
