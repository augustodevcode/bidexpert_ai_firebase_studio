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

const baseURL = process.env.BASE_URL || 'http://demo.localhost:9015';

// GlobalSetup é condicional: só roda se o arquivo de auth não existir e SKIP_GLOBAL_SETUP não estiver definido
const authFile = path.join(__dirname, 'tests/e2e/.auth/admin.json');
const skipSetup = process.env.SKIP_GLOBAL_SETUP === '1';
const hasAuth = fs.existsSync(authFile);
const globalSetup = (skipSetup || !hasAuth) ? undefined : './tests/e2e/global-setup.ts';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0, // Loop externo gerencia retries com correção entre eles
  workers: 1,
  globalSetup,
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
