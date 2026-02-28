/**
 * @fileoverview Playwright config for Fast Full UI Sweep (Varredura Completa).
 *
 * Usa port 9006 (environment DEV isolado).
 * storageState do admin é aplicado globalmente — sem loginAs() por teste.
 * 4 workers paralelos, headless por padrão.
 */

import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9006';
const HEADED = process.env.HEADED === '1';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'sweep-fast.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 4,
  timeout: 45_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [
    ['html', { outputFolder: 'playwright-report/sweep', open: 'never' }],
    ['json', { outputFile: 'test-results/sweep/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    headless: !HEADED,
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    viewport: { width: 1440, height: 900 },
    storageState: 'tests/e2e/.auth/admin.json',
  },
  projects: [
    {
      name: 'sweep-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/admin.json',
      },
    },
  ],
  webServer: {
    command: 'echo "Servidor já em execução em 9006"',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 10_000,
  },
});