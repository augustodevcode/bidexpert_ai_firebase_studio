/**
 * @fileoverview Repórter Playwright otimizado para consumo pelo GitHub Copilot Agent.
 * Projetado para minimizar tokens desperdiçados (suprime sucessos) e maximizar
 * a densidade de informação útil para o loop de auto-cura autônoma.
 *
 * Emite apenas:
 *   - TEST_FAIL: com arquivo, titulo, erro, stack compacto
 *   - BROWSER_TELEMETRY: dados exfiltrados do console/rede do browser
 *   - SUMMARY: tabela compacta no final
 *
 * Configuração no playwright.config.ts:
 *   reporter: [['./tests/e2e/reporters/ai-friendly-reporter.ts', { outputFile: 'test-output.log' }]]
 */

import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface FailedTest {
  title: string;
  file: string;
  line: number;
  error: string;
  stack: string;
  duration: number;
  browserTelemetry: string[];
  retry: number;
}

interface AIFriendlyReporterOptions {
  outputFile?: string;
  /** Se true, inclui testes passados no log (default: false) */
  verbose?: boolean;
}

class AIFriendlyReporter implements Reporter {
  private failures: FailedTest[] = [];
  private passedCount = 0;
  private skippedCount = 0;
  private totalCount = 0;
  private startTime = 0;
  private outputFile: string;
  private verbose: boolean;
  private logLines: string[] = [];

  constructor(options: AIFriendlyReporterOptions = {}) {
    this.outputFile = options.outputFile || 'test-output.log';
    this.verbose = options.verbose || false;
  }

  private log(line: string) {
    this.logLines.push(line);
    // Falhas vão direto pro console para o agente capturar em tempo real
    if (line.startsWith('TEST_FAIL') || line.startsWith('ROOT_CAUSE') || line.startsWith('BROWSER_TELEMETRY')) {
      console.log(line);
    }
  }

  onBegin(_config: FullConfig, _suite: Suite) {
    this.startTime = Date.now();
    this.log(`[AI_REPORTER] Execução iniciada em ${new Date().toISOString()}`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.totalCount++;

    if (result.status === 'skipped') {
      this.skippedCount++;
      return;
    }

    if (result.status === 'passed') {
      this.passedCount++;
      if (this.verbose) {
        this.log(`TEST_PASS: ${test.title} (${result.duration}ms)`);
      }
      return;
    }

    // ─── FALHA ou TIMEOUT ───
    const errorMsg = result.error?.message || 'Unknown error';
    const errorStack = result.error?.stack
      ? result.error.stack
          .split('\n')
          .slice(0, 8)
          .map((l) => l.trim())
          .join('\n')
      : '';

    // Extrair telemetria do browser dos stdout/stderr do teste
    const browserTelemetry: string[] = [];
    for (const attachment of result.attachments) {
      if (attachment.name === 'stderr' || attachment.name === 'stdout') {
        const content = attachment.body?.toString() || '';
        const telemetryLines = content
          .split('\n')
          .filter((l) =>
            l.includes('[BROWSER_CONSOLE_ERROR]') ||
            l.includes('[BROWSER_PAGE_ERROR]') ||
            l.includes('[BROWSER_REQUEST_FAILED]') ||
            l.includes('[BROWSER_CONSOLE_WARN]')
          );
        browserTelemetry.push(...telemetryLines);
      }
    }

    // Também captura dos stdout do resultado
    if (result.stdout.length > 0) {
      for (const output of result.stdout) {
        const text = typeof output === 'string' ? output : output.toString();
        const lines = text.split('\n').filter((l) =>
          l.includes('[BROWSER_') || l.includes('[BROWSER_TELEMETRY_SUMMARY]')
        );
        browserTelemetry.push(...lines);
      }
    }
    if (result.stderr.length > 0) {
      for (const output of result.stderr) {
        const text = typeof output === 'string' ? output : output.toString();
        const lines = text.split('\n').filter((l) => l.includes('[BROWSER_'));
        browserTelemetry.push(...lines);
      }
    }

    const failure: FailedTest = {
      title: test.title,
      file: test.location.file,
      line: test.location.line,
      error: errorMsg,
      stack: errorStack,
      duration: result.duration,
      browserTelemetry: [...new Set(browserTelemetry)].slice(0, 15), // dedupe, limit
      retry: result.retry,
    };
    this.failures.push(failure);

    // Emissão imediata para o agente capturar no terminal
    this.log(`TEST_FAIL: ${test.title}`);
    this.log(`  FILE: ${test.location.file}:${test.location.line}`);
    this.log(`  ROOT_CAUSE: ${errorMsg.slice(0, 500)}`);
    if (errorStack) {
      this.log(`  STACK:\n${errorStack}`);
    }
    if (browserTelemetry.length > 0) {
      this.log(`  BROWSER_TELEMETRY:`);
      browserTelemetry.slice(0, 10).forEach((t) => this.log(`    ${t}`));
    }
    this.log('---');
  }

  onEnd(result: FullResult) {
    const duration = Date.now() - this.startTime;
    const failedCount = this.failures.length;

    this.log('');
    this.log('═══════════════════════════════════════════════════════════');
    this.log('[AI_SUMMARY]');
    this.log(`  STATUS: ${result.status.toUpperCase()}`);
    this.log(`  TOTAL: ${this.totalCount}`);
    this.log(`  PASSED: ${this.passedCount}`);
    this.log(`  FAILED: ${failedCount}`);
    this.log(`  SKIPPED: ${this.skippedCount}`);
    this.log(`  DURATION: ${Math.round(duration / 1000)}s`);
    this.log(`  SUCCESS_RATE: ${this.totalCount > 0 ? Math.round((this.passedCount / this.totalCount) * 100) : 0}%`);
    this.log('═══════════════════════════════════════════════════════════');

    if (failedCount > 0) {
      this.log('');
      this.log('[AI_FAILED_TESTS_INDEX]');
      this.failures.forEach((f, i) => {
        this.log(`  ${i + 1}. ${f.title}`);
        this.log(`     FILE: ${f.file}:${f.line}`);
        this.log(`     ERROR: ${f.error.slice(0, 200)}`);
        if (f.browserTelemetry.length > 0) {
          this.log(`     BROWSER_HINTS: ${f.browserTelemetry.length} evento(s)`);
        }
      });
    }

    // Persistir em arquivo para fallback de leitura estática
    try {
      const dir = path.dirname(this.outputFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.outputFile, this.logLines.join('\n'), 'utf-8');
    } catch (err) {
      console.error(`[AI_REPORTER] Falha ao gravar ${this.outputFile}:`, err);
    }
  }
}

export default AIFriendlyReporter;
