/**
 * @fileoverview Playwright config para testes da Biblioteca de Mídia — Vercel demo.
 *
 * Pré-requisito: deploy já realizado no Vercel.
 *
 * Execução:
 *   npx playwright test --config=playwright.media-vercel.config.ts
 *   PLAYWRIGHT_BASE_URL=https://seu-deploy.vercel.app npx playwright test --config=playwright.media-vercel.config.ts
 */
import { defineConfig, devices } from '@playwright/test';

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.VERCEL_URL ||
  'https://bidexpertaifirebasestudio.vercel.app';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/media-library-mcp.spec.ts',
  timeout: 240_000,  // extra timeout para cold-start Vercel
  expect: { timeout: 30_000 },
  fullyParallel: false,
  retries: 2,        // Vercel pode ter instabilidade pontual
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-media-vercel' }],
    ['json', { outputFile: 'test-results/media-vercel-results.json' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'retain-on-failure',
    actionTimeout: 45_000,
    navigationTimeout: 180_000,
    headless: true,  // CI/CD headless
  },
  projects: [
    {
      name: 'chromium-media-vercel',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
