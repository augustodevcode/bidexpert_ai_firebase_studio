/**
 * @fileoverview Playwright config for Fast Full UI Sweep (Varredura Completa).
 *
 * Usa port 9010 (environment DEV isolado).
 * storageState do admin é aplicado globalmente — sem loginAs() por teste.
 * 1 worker para estabilidade em dev mode.
 */

import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9010';
const HEADED = process.env.HEADED === '1';
const ADMIN_AUTH = 'tests/e2e/.auth/admin.json';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'sweep-fast.spec.ts',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 20_000,
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
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
    viewport: { width: 1440, height: 900 },
    storageState: ADMIN_AUTH,
  },
  projects: [
    {
      name: 'sweep',
      use: {
        ...devices['Desktop Chrome'],
        storageState: ADMIN_AUTH,
      },
    },
  ],
  webServer: {
    command: 'echo "Servidor já em execução em 9010"',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 10_000,
  },
});