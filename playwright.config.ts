// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Use a custom port for Playwright to avoid conflicts with the main app
const PORT = process.env.PORT || 9002;
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${PORT}`;

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
require('dotenv').config();

export default defineConfig({
  testDir: './tests', // Buscar testes em todas as subpastas de tests
  outputDir: './tests/test-results/', // Directory for test artifacts
  timeout: 360000, // 6 minutes for global test timeout (app is very slow)
  /* Run tests in files in the order of their definition */
  fullyParallel: false, // Disabled due to slow app loading times
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0, // Reduced retries due to slow loading
  /* Opt out of parallel tests on CI. */
  workers: 1, // Single worker due to slow app performance
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: './tests/playwright-report/' }], // HTML report
    ['./playwright-custom-reporter.js', { outputFile: './tests/test-results/plaintext-report.txt' }], // Custom plaintext report
    ['junit', { outputFile: './tests/test-results/junit-report.xml' }], // JUnit XML for CI/CD
    ['json', { outputFile: './tests/test-results/test-results.json' }], // JSON report
    ['line'] // Simple one-line per test output in console
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on', // Capture trace for all tests
    screenshot: 'only-on-failure',
    navigationTimeout: 300000, // 5 minutes for page navigation timeout (app is very slow)
    actionTimeout: 90000, // 1.5 minutes for individual actions
    // Custom option for Playwright to launch the dev server
    // launchOptions: {
    //   args: [`--port=${PORT}`],
    // },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Removido webServer para evitar conflitos - servidor gerenciado externamente
  // webServer: {
  //   command: 'npm run dev',
  //   url: BASE_URL,
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 600 * 1000, // Increased timeout for server startup to 10 minutes (app is slow)
  // },
});