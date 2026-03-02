/**
 * @fileoverview Playwright config for validating currency feature on Vercel Preview deployments.
 * Uses x-vercel-protection-bypass header to bypass SSO/Deployment Protection.
 *
 * Usage:
 *   $env:VERCEL_DEPLOYMENT_URL = "https://bidexpertaifirebasestudio-xxx-augustos-projects-d51a961f.vercel.app"
 *   $env:VERCEL_AUTOMATION_BYPASS_SECRET = "<secret>"
 *   npx playwright test --config=playwright.currency-vercel.config.ts
 */
import { defineConfig, devices } from '@playwright/test';

const deploymentUrl = process.env.VERCEL_DEPLOYMENT_URL
  ?? 'https://bidexpertaifirebasestudio-g32xqzl6e-augustos-projects-d51a961f.vercel.app';

const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  ?? '';

if (!bypassSecret) {
  console.warn(
    '⚠️  VERCEL_AUTOMATION_BYPASS_SECRET not set. Tests will likely fail due to Vercel SSO protection.',
  );
}

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/currency-vercel-validation.spec.ts',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-currency-vercel' }],
  ],
  use: {
    baseURL: deploymentUrl,
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'retain-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
    headless: false,
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': bypassSecret,
      'x-vercel-set-bypass-cookie': 'true',
    },
  },
  projects: [
    {
      name: 'chromium-vercel',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: undefined,
});
