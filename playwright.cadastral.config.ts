/**
 * @fileoverview Playwright config focused on cadastral-source-sync test only.
 * Avoids scanning other test files that trigger bcrypt native module errors on Node 24.
 */
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://dev.localhost:9007';
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();

export default defineConfig({
  testDir: './tests/e2e/admin',
  testMatch: 'cadastral-source-sync.spec.ts',
  timeout: 600_000, // 10 min — this test is a long cadastral registration flow
  expect: { timeout: 30_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  globalSetup: './tests/e2e/global-setup.ts',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 60000,
    extraHTTPHeaders: bypassSecret ? {
      'x-vercel-protection-bypass': bypassSecret,
      'x-vercel-set-bypass-cookie': 'true',
    } : undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './tests/e2e/.auth/admin.json',
      },
    },
  ],
});
