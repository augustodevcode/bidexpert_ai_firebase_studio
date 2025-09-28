// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Use a custom port for Playwright to avoid conflicts with the main app
const PORT = process.env.PORT || 9003;
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${PORT}`;

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
require('dotenv').config();

export default defineConfig({
  testDir: './tests', // Set test directory to ui
  outputDir: 'test-results/', // Directory for test artifacts
  timeout: 120000, // 2 minutes for global test timeout
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
    ['html'], // HTML report (default location: playwright-report/)
    ['./playwright-custom-reporter.js', { outputFile: 'test-results/plaintext-report.txt' }], // Custom plaintext report
    ['junit', { outputFile: 'test-results/junit-report.xml' }], // JUnit XML for CI/CD
    ['json', { outputFile: 'test-results/test-results.json' }], // JSON report
    ['line'] // Simple one-line per test output in console
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on', // Capture trace for all tests
    screenshot: 'only-on-failure',
    navigationTimeout: 180000, // 3 minutes for page navigation timeout
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

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev:playwright',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 600 * 1000, // Increased timeout for server startup to 10 minutes (app is slow)
  },
});
