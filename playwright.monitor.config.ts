/**
 * @fileoverview Playwright config for admin-monitor-integration tests.
 * Bypasses global-setup auth issues by letting each test handle its own login.
 */
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://demo.localhost:9005';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'admin-monitor-integration.spec.ts',
  timeout: 3 * 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-monitor' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 3 * 60_000,
    headless: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev:9005',
    port: 9005,
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 3 * 60 * 1000,
  },
});
