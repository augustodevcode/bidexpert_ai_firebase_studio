/**
 * Playwright Configuration for Robot Auction Simulation
 * Target: https://bidexpertaifirebasestudio.vercel.app/
 */

import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://bidexpertaifirebasestudio.vercel.app';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/robot-auction-simulation.spec.ts',
  timeout: 60 * 60 * 1000, // 1 hora para teste completo
  expect: { 
    timeout: 30000,
  },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'test-results/robot-auction/report' }],
    ['json', { outputFile: 'test-results/robot-auction/results.json' }],
    ['junit', { outputFile: 'test-results/robot-auction/junit.xml' }]
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 30000,
    navigationTimeout: 60000,
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium-robot',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
});
