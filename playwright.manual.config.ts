import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:9005';

export default defineConfig({
  testDir: './tests/itsm',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    storageState: './tests/e2e/.auth/admin.json',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
