/**
 * @fileoverview Playwright config para testes da Biblioteca de Mídia — DEV local (porta 9007).
 *
 * Pré-requisito: servidor rodando em http://dev.localhost:9007
 *   node .vscode/start-9007-dev.js
 *
 * Execução:
 *   npx playwright test --config=playwright.media-local.config.ts
 */
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://dev.localhost:9007';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/media-library-mcp.spec.ts',
  timeout: 180_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-media-local' }],
    ['json', { outputFile: 'test-results/media-local-results.json' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'retain-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 120_000,
    headless: false,
  },
  projects: [
    {
      name: 'chromium-media-local',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
