/**
 * @fileoverview Playwright config para testes de mensagens de contato.
 * Usa servidor já em execução — sem globalSetup, sem webServer block.
 * 
 * Uso:
 *   $env:PLAYWRIGHT_TEST_BASE_URL='http://dev.localhost:9006'
 *   npx playwright test tests/e2e/contact-messages.spec.ts --config=playwright.contact.config.ts
 */

import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://dev.localhost:9006';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  timeout: 120_000,
  retries: 1,
  workers: 1,
  reporter: [['line'], ['html', { outputFolder: 'playwright-report-contact', open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
