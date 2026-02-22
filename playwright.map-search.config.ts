/**
 * playwright.map-search.config.ts
 * Configuração Playwright dedicada para testes do Map Search.
 * Não requer globalSetup (testes são públicos/guest).
 */

import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.MAP_BASE_URL || 'http://demo.localhost:9005';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/map-search-layout.spec.ts', '**/map-search-dataset.spec.ts', '**/map-views.spec.ts'],

  timeout: 60_000,
  expect: { timeout: 15_000 },

  fullyParallel: false,
  retries: 1,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'test-results/map-search/report' }],
    ['json', { outputFile: 'test-results/map-search/results.json' }],
  ],

  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    headless: process.env.CI === 'true' || process.env.HEADLESS === 'true',
  },

  outputDir: 'test-results/map-search/artifacts',

  projects: [
    {
      name: 'map-search-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        storageState: './tests/e2e/.auth/admin.json',
      },
    },
  ],
});
