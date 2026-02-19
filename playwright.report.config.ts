import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'comprehensive-smoke.spec.ts',
  timeout: 600_000, // 10 minutes, as we are visiting many pages
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-smoke' }],
  ],
  use: {
    baseURL: 'https://bidexpertaifirebasestudio.vercel.app',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 20000,
    navigationTimeout: 60000,
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
