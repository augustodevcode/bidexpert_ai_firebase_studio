/**
 * playwright.monitor-v2.config.ts
 * Playwright config for Monitor V2 Big-Bang E2E tests.
 */

import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PREGAO_BASE_URL || 'http://demo.localhost:9005';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/monitor-pregao-v2-bigbang.spec.ts',
  timeout: 8 * 60 * 1000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'test-results/monitor-v2/report' }],
    ['json', { outputFile: 'test-results/monitor-v2/results.json' }],
  ],
  use: {
    baseURL: BASE_URL,
    video: 'on',
    videoSize: { width: 1280, height: 720 },
    screenshot: 'on',
    trace: 'on',
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    headless: process.env.CI === 'true' || process.env.HEADLESS === 'true',
  },
  outputDir: 'test-results/monitor-v2/artifacts',
  projects: [
    {
      name: 'monitor-v2-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});
