/**
 * @fileoverview Playwright config for header UI tests (no auth needed).
 * Uses BASE_URL when provided so the same spec can validate worktrees and Vercel previews.
 */
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://demo.localhost:9005';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    headless: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
