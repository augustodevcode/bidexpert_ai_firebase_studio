/**
 * @fileoverview Configuração Playwright dedicada ao fluxo CRUD completo em modo visual
 * fullscreen/maximizado para observabilidade em tempo real.
 */
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://demo.localhost:9005';
const shouldStartWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER !== '1';
process.env.BASE_URL = baseURL;

export default defineConfig({
  testDir: './tests/e2e/admin',
  testMatch: /autonomous-full-crud-flow\.spec\.ts/,
  timeout: 15 * 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/autonomous-full-crud-results.json' }],
  ],
  use: {
    baseURL,
    headless: false,
    viewport: null,
    launchOptions: {
      args: ['--start-maximized'],
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 90_000,
    storageState: './tests/e2e/.auth/admin.json',
  },
  projects: [
    {
      name: 'chromium-fullscreen',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: shouldStartWebServer
    ? {
        command: 'npm run dev:9005',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 3 * 60_000,
      }
    : undefined,
});
