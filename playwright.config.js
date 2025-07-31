import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Look for test files in the "tests/e2e" directory.
  testDir: 'tests/e2e',

  // The directory for test results, traces, and screenshots.
  outputDir: 'tests/test-results',

  // General timeout for each test.
  timeout: 30 * 1000,

  // Expectations timeout.
  expect: {
    timeout: 5000,
  },

  // Reporter configuration.
  reporter: [
    ['html', { outputFolder: 'tests/playwright-report' }],
    ['json', { outputFile: 'tests/test-results.json' }],
  ],

  // Shared settings for all the projects below.
  use: {
    // Capture screenshot only when a test fails.
    screenshot: 'only-on-failure',

    // Record video only when a test fails.
    video: 'retain-on-failure',

    // Collect trace only when a test fails.
    trace: 'retain-on-failure',
  },
});
