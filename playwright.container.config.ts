/**
 * @fileoverview Playwright Config para Containers Isolados por Dev
 * Usa BASE_URL do env para execução dentro do container.
 * Cada dev tem seu próprio relatório e artefatos.
 * USO: xvfb-run --auto-servernum npx playwright test --config=playwright.container.config.ts
 */

import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
const DEV_ID = process.env.DEV_ID || 'unknown';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120_000, // 2 min por teste (lazy compilation no dev mode)
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: `playwright-report` }],
    ['json', { outputFile: `test-results/results-${DEV_ID}.json` }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 60000, // Lazy compilation pode demorar na primeira vez
    headless: false, // Visível via xvfb-run para debugging e compliance
  },
  projects: [
    {
      name: `dev-${DEV_ID}-smoke`,
      testMatch: '**/smoke-test.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: `dev-${DEV_ID}-e2e`,
      testMatch: '**/*.spec.ts',
      testIgnore: '**/smoke-test.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
