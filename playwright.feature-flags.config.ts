/**
 * @fileoverview Playwright config for feature-flags-db-persist test.
 * Uses port 9006 (worktree dev server) with video recording enabled.
 */
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://demo.localhost:9006';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'feature-flags-db-persist.spec.ts',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report/feature-flags' }],
  ],
  use: {
    baseURL,
    trace: 'on',
    screenshot: 'on',
    video: 'on', // Record video evidence for all tests
    actionTimeout: 15000,
    navigationTimeout: 30000,
    headless: false,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
