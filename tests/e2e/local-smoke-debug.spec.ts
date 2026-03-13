/**
 * @file Local Smoke Debug Test
 * @description Navigates key pages and captures console errors + network failures.
 * Meant to be run against local dev server on port 9006.
 */

import { test, expect } from '@playwright/test';

const BASE = 'http://demo.localhost:9006';

// Collect all console errors and network failures
const consoleErrors: string[] = [];
const networkFailures: string[] = [];

test.describe('Local Smoke Debug - All Critical Pages', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.setTimeout(120_000); // Dev mode lazy compilation can be slow

  test.beforeEach(async ({ page }) => {
    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[CONSOLE_ERROR] ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(`[PAGE_ERROR] ${err.message}`);
    });
    // Capture failed network requests (4xx, 5xx)
    page.on('response', (response) => {
      if (response.status() >= 400) {
        networkFailures.push(`[NETWORK_${response.status()}] ${response.url()}`);
      }
    });
    page.on('requestfailed', (request) => {
      networkFailures.push(`[REQUEST_FAILED] ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test('1. Homepage loads without 500', async ({ page }) => {
    const response = await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 });
    console.log(`Homepage status: ${response?.status()}`);
    expect(response?.status()).toBeLessThan(500);
    // Wait for hydration
    await page.waitForTimeout(3000);
    // Check for error boundary
    const errorBoundary = await page.locator('text=Something went wrong').count();
    if (errorBoundary > 0) {
      const bodyText = await page.locator('body').innerText();
      console.log(`[ERROR_BOUNDARY] Homepage shows error: ${bodyText.substring(0, 500)}`);
    }
    // Take screenshot
    await page.screenshot({ path: 'test-results/smoke-homepage.png', fullPage: false });
  });

  test('2. Login page renders', async ({ page }) => {
    const response = await page.goto(BASE + '/auth/login', { waitUntil: 'domcontentloaded', timeout: 90000 });
    console.log(`Login page status: ${response?.status()}`);
    expect(response?.status()).toBeLessThan(500);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/smoke-login.png', fullPage: false });
  });

  test('3. Search page loads', async ({ page }) => {
    const response = await page.goto(BASE + '/search', { waitUntil: 'domcontentloaded', timeout: 90000 });
    console.log(`Search page status: ${response?.status()}`);
    expect(response?.status()).toBeLessThan(500);
    await page.waitForTimeout(3000);
    const errorBoundary = await page.locator('text=Something went wrong').count();
    if (errorBoundary > 0) {
      const bodyText = await page.locator('body').innerText();
      console.log(`[ERROR_BOUNDARY] Search shows error: ${bodyText.substring(0, 500)}`);
    }
    await page.screenshot({ path: 'test-results/smoke-search.png', fullPage: false });
  });

  test('4. FAQ page loads', async ({ page }) => {
    const response = await page.goto(BASE + '/faq', { waitUntil: 'domcontentloaded', timeout: 90000 });
    console.log(`FAQ page status: ${response?.status()}`);
    expect(response?.status()).toBeLessThan(500);
  });

  test('5. Terms page loads', async ({ page }) => {
    const response = await page.goto(BASE + '/terms', { waitUntil: 'domcontentloaded', timeout: 90000 });
    console.log(`Terms page status: ${response?.status()}`);
    expect(response?.status()).toBeLessThan(500);
  });

  test.afterAll(async () => {
    console.log('\n=== SMOKE TEST TELEMETRY REPORT ===');
    console.log(`Console Errors: ${consoleErrors.length}`);
    consoleErrors.forEach(e => console.log(e));
    console.log(`Network Failures: ${networkFailures.length}`);
    networkFailures.forEach(e => console.log(e));
    console.log('=== END REPORT ===\n');
  });
});
