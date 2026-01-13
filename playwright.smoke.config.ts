/**
 * @file Playwright Config - Smoke Tests Only
 * @description Configuration for smoke tests that don't require authentication.
 * Skips global-setup to allow testing basic server health without DB connection.
 */

import { defineConfig, devices } from '@playwright/test';

const shouldStartWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER !== '1';
const _isCI = process.env.CI === '1' || process.env.CI === 'true';
const baseURL = process.env.BASE_URL || 'http://localhost:9002';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/smoke-test.spec.ts', // Only smoke tests
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  // NO globalSetup - smoke tests don't need auth
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/smoke-results.json' }]
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 20000,
  },
  projects: [
    {
      name: 'smoke',
      use: {
        ...devices['Desktop Chrome'],
        // No storageState - unauthenticated tests
      },
    },
  ],
  webServer: shouldStartWebServer ? {
    command: 'npm run start:9002',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 60_000,
    env: {
      BASE_URL: baseURL,
      PORT: '9002',
    }
  } : undefined,
});
