/**
 * @fileoverview Configuração Playwright otimizada para o loop autônomo de auto-cura.
 * Diferenças em relação ao playwright.config.local.ts:
 *   - Não sobe webServer (assume servidor já rodando)
 *   - Usa repórter AI-friendly + fallback estático em test-output.log
 *   - Telemetria de browser via fixture global
 *   - Timeout agressivo para feedback rápido ao agente
 *   - Retries = 0 (o loop externo é quem re-executa)
 */
import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import fs from 'fs';

process.env.DATABASE_URL ??= 'mysql://root:M%21nh%40S3nha2025@localhost:3306/bidexpert_demo';
process.env.ACTIVE_DATABASE_SYSTEM ??= 'MYSQL';
process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM ??= 'MYSQL';

const baseURL = process.env.BASE_URL || 'http://demo.localhost:9007';

// GlobalSetup é condicional: só roda se o arquivo de auth não existir e SKIP_GLOBAL_SETUP não estiver definido
const authFile = path.join(__dirname, 'tests/e2e/.auth/admin.json');
const skipSetup = process.env.SKIP_GLOBAL_SETUP === '1';
const hasAuth = fs.existsSync(authFile);
const globalSetup = (skipSetup || !hasAuth) ? undefined : './tests/e2e/global-setup.ts';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0, // Loop externo gerencia retries com correção entre eles
  workers: 1,
  globalSetup,
  globalTeardown: './tests/e2e/hooks/browser-telemetry-global.ts',
  reporter: [
    ['list'],
    ['./tests/e2e/reporters/ai-friendly-reporter.ts', {
      outputFile: 'test-output.log',
      verbose: false,
    }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10000,
    navigationTimeout: 20000,
  },
  projects: [
    {
      name: 'chromium-autofix',
      use: {
        ...devices['Desktop Chrome'],
        storageState: hasAuth ? authFile : { cookies: [], origins: [] },
      },
    },
    {
      name: 'chromium-noauth',
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
    },
  ],
});
