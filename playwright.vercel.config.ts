/**
 * @fileoverview Configuração Playwright para testes contra o ambiente Vercel.
 * Usage: npx playwright test --config=playwright.vercel.config.ts
 */
import { defineConfig, devices } from '@playwright/test';

const VERCEL_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://demo.bidexpert.com.br';
const VERCEL_SHARE_TOKEN = process.env.VERCEL_SHARE_TOKEN || '';
const STORAGE_STATE_PATH = './playwright/.vercel-auth.json';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/vercel-smoke.spec.ts'],
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-vercel' }],
  ],
  use: {
    baseURL: VERCEL_URL,
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 60000,
    headless: false,
  },
  projects: [
    ...(VERCEL_SHARE_TOKEN ? [{
      name: 'vercel-auth-setup',
      testMatch: /vercel-auth\.setup\.ts/,
    }] : []),
    {
      name: 'chromium-vercel',
      use: {
        ...devices['Desktop Chrome'],
        ...(VERCEL_SHARE_TOKEN ? { storageState: STORAGE_STATE_PATH } : {}),
      },
      ...(VERCEL_SHARE_TOKEN ? { dependencies: ['vercel-auth-setup'] } : {}),
    },
  ],
});
