/**
 * @file playwright.chrome-persistent.config.ts
 * @description Playwright config that uses the REAL installed Chrome with persistent session.
 * 
 * Features:
 * - Uses system Chrome (channel: 'chrome') instead of bundled Chromium
 * - Anti-automation flags to bypass Google "unsafe browser" detection
 * - Single Chrome project to avoid opening multiple browsers
 * - storageState persistence to keep auth sessions across runs
 * 
 * Usage:
 *   npx playwright test --config=playwright.chrome-persistent.config.ts
 *   PLAYWRIGHT_BASE_URL=https://... npx playwright test --config=playwright.chrome-persistent.config.ts
 */
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://bidexpertaifirebasestudio.vercel.app';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /smoke.*\.spec\.ts$/,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,       // Sequential to reuse the same browser process
  retries: 1,
  workers: 1,                 // Single worker = single Chrome process
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: false,
    ignoreHTTPSErrors: true,
    channel: 'chrome',        // Use real installed Chrome, not bundled Chromium
    launchOptions: {
      channel: 'chrome',
      slowMo: 50,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-infobars',
      ],
    },
  },
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
});
