/**
 * @fileoverview Fixture global de telemetria de navegador para Playwright.
 * Captura console.log/error/warn, pageerror e requestfailed do browser
 * e os exfiltra para stdout com tags semânticas que o Copilot Agent consegue
 * parsear de forma determinística no loop autônomo de auto-cura.
 *
 * USO: import { test } from '../fixtures/browser-telemetry.fixture';
 * Em vez de: import { test } from '@playwright/test';
 */
import { test as base, Page } from '@playwright/test';

/** Prefixos semânticos para o agente AI discriminar origem da telemetria */
const TAG = {
  CONSOLE_ERROR: '[BROWSER_CONSOLE_ERROR]',
  CONSOLE_WARN: '[BROWSER_CONSOLE_WARN]',
  PAGE_ERROR: '[BROWSER_PAGE_ERROR]',
  REQUEST_FAILED: '[BROWSER_REQUEST_FAILED]',
  CONSOLE_INFO: '[BROWSER_CONSOLE_INFO]',
} as const;

/** Tipo para mensagens interceptadas */
interface BrowserTelemetryEntry {
  tag: string;
  message: string;
  timestamp: number;
  url?: string;
}

/**
 * Fixture estendida que automaticamente acopla listeners de telemetria
 * no objeto page ANTES de cada teste, e despeja um sumário APÓS cada teste.
 */
export const test = base.extend<{
  /** Acesso direto às entradas de telemetria coletadas durante o teste */
  browserTelemetry: BrowserTelemetryEntry[];
}>({
  browserTelemetry: [async ({ page }, use) => {
    const entries: BrowserTelemetryEntry[] = [];

    // ─── Console Messages (error + warn apenas, evita flood de tokens) ───
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        const entry: BrowserTelemetryEntry = {
          tag: TAG.CONSOLE_ERROR,
          message: text,
          timestamp: Date.now(),
        };
        entries.push(entry);
        console.error(`${TAG.CONSOLE_ERROR} ${text}`);
      } else if (type === 'warning') {
        const entry: BrowserTelemetryEntry = {
          tag: TAG.CONSOLE_WARN,
          message: text,
          timestamp: Date.now(),
        };
        entries.push(entry);
        console.warn(`${TAG.CONSOLE_WARN} ${text}`);
      }
    });

    // ─── Page Errors (unhandled exceptions no runtime JS da página) ───
    page.on('pageerror', (error) => {
      const entry: BrowserTelemetryEntry = {
        tag: TAG.PAGE_ERROR,
        message: `${error.name}: ${error.message}`,
        timestamp: Date.now(),
      };
      entries.push(entry);
      console.error(`${TAG.PAGE_ERROR} ${error.name}: ${error.message}`);
      if (error.stack) {
        const shortStack = error.stack.split('\n').slice(0, 5).join('\n');
        console.error(`${TAG.PAGE_ERROR} Stack: ${shortStack}`);
      }
    });

    // ─── Request Failed (falhas de rede: 4xx, 5xx, CORS, timeout) ───
    page.on('requestfailed', (request) => {
      const failure = request.failure();
      const entry: BrowserTelemetryEntry = {
        tag: TAG.REQUEST_FAILED,
        message: `${request.method()} ${request.url()} → ${failure?.errorText || 'unknown'}`,
        timestamp: Date.now(),
        url: request.url(),
      };
      entries.push(entry);
      console.error(`${TAG.REQUEST_FAILED} ${request.method()} ${request.url()} → ${failure?.errorText || 'unknown'}`);
    });

    // ─── Response errors (status >= 500) ───
    page.on('response', (response) => {
      if (response.status() >= 500) {
        const entry: BrowserTelemetryEntry = {
          tag: TAG.REQUEST_FAILED,
          message: `${response.request().method()} ${response.url()} → HTTP ${response.status()}`,
          timestamp: Date.now(),
          url: response.url(),
        };
        entries.push(entry);
        console.error(`${TAG.REQUEST_FAILED} ${response.request().method()} ${response.url()} → HTTP ${response.status()}`);
      }
    });

    // Entrega a fixture (o teste roda aqui)
    await use(entries);

    // ─── Post-test: sumário de telemetria se houve problemas ───
    if (entries.length > 0) {
      console.log(`\n[BROWSER_TELEMETRY_SUMMARY] ${entries.length} evento(s) interceptados:`);
      const errors = entries.filter(e => e.tag === TAG.CONSOLE_ERROR || e.tag === TAG.PAGE_ERROR);
      const networkFails = entries.filter(e => e.tag === TAG.REQUEST_FAILED);
      
      if (errors.length > 0) {
        console.log(`  └─ ${errors.length} erro(s) JS/console`);
        errors.slice(0, 5).forEach(e => console.log(`     ${e.tag} ${e.message}`));
      }
      if (networkFails.length > 0) {
        console.log(`  └─ ${networkFails.length} falha(s) de rede`);
        networkFails.slice(0, 5).forEach(e => console.log(`     ${e.tag} ${e.message}`));
      }
    }
  }, { auto: true }],
});

export { expect } from '@playwright/test';
