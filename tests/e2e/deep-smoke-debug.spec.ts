/**
 * @file Deep Smoke Debug Test
 * @description Tests authenticated pages, admin dashboard, auction detail, and dynamic routes.
 * Captures console errors, page errors, and network failures for debugging.
 */

import { test, expect } from '@playwright/test';

const BASE = 'http://demo.localhost:9006';

// Global telemetry collectors
const allConsoleErrors: { test: string; errors: string[] }[] = [];
const allNetworkFailures: { test: string; failures: string[] }[] = [];
const allPageErrors: { test: string; errors: string[] }[] = [];

function setupTelemetry(page: any, testName: string) {
  const consoleErrors: string[] = [];
  const networkFailures: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err: any) => {
    pageErrors.push(`${err.name}: ${err.message}`);
  });
  page.on('response', (response: any) => {
    if (response.status() >= 400) {
      networkFailures.push(`[${response.status()}] ${response.url()}`);
    }
  });
  page.on('requestfailed', (request: any) => {
    networkFailures.push(`[FAILED] ${request.url()} - ${request.failure()?.errorText}`);
  });

  return { consoleErrors, networkFailures, pageErrors, flush: () => {
    allConsoleErrors.push({ test: testName, errors: [...consoleErrors] });
    allNetworkFailures.push({ test: testName, failures: [...networkFailures] });
    allPageErrors.push({ test: testName, errors: [...pageErrors] });
  }};
}

test.describe('Deep Smoke Debug - Authenticated & Dynamic Pages', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.setTimeout(120_000);

  test('1. Login flow and dashboard access', async ({ page }) => {
    const t = setupTelemetry(page, 'login-flow');
    
    // Navigate to login
    await page.goto(BASE + '/auth/login', { waitUntil: 'domcontentloaded', timeout: 90000 });
    expect(page.url()).toContain('/auth/login');
    
    // Fill login form with admin credentials
    const emailField = page.locator('input[type="email"], input[name="email"], [data-ai-id*="email"]');
    const passwordField = page.locator('input[type="password"], input[name="password"], [data-ai-id*="password"]');
    
    if (await emailField.count() > 0) {
      await emailField.first().fill('admin@bidexpert.com.br');
      await passwordField.first().fill('Admin@123');
      
      // Find and click submit button
      const submitBtn = page.locator('button[type="submit"], [data-ai-id*="login-submit"]');
      if (await submitBtn.count() > 0) {
        await submitBtn.first().click();
        // Wait for navigation after login
        await page.waitForTimeout(5000);
        console.log(`After login URL: ${page.url()}`);
        await page.screenshot({ path: 'test-results/deep-after-login.png', fullPage: false });
      }
    } else {
      console.log('Login form fields not found - checking page content');
      const body = await page.locator('body').innerText();
      console.log(`Login page content: ${body.substring(0, 300)}`);
    }
    
    t.flush();
  });

  test('2. Homepage - check all sections render', async ({ page }) => {
    const t = setupTelemetry(page, 'homepage-sections');
    
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(5000);
    
    // Check main sections
    const body = await page.locator('body').innerText();
    console.log(`Homepage length: ${body.length} chars`);
    
    // Check for common error patterns
    const errorPatterns = [
      'Something went wrong',
      'Error',
      'undefined',
      'null',
      'NaN',
      'Internal Server Error',
      '[object Object]'
    ];
    
    for (const pattern of errorPatterns) {
      const count = await page.locator(`text="${pattern}"`).count();
      if (count > 0 && pattern !== 'Error') {
        console.log(`[WARNING] Found "${pattern}" ${count} times on homepage`);
      }
    }
    
    // Check for broken images
    const images = page.locator('img');
    const imgCount = await images.count();
    let brokenImages = 0;
    for (let i = 0; i < Math.min(imgCount, 20); i++) {
      const img = images.nth(i);
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      if (naturalWidth === 0) {
        const src = await img.getAttribute('src');
        console.log(`[BROKEN_IMAGE] ${src}`);
        brokenImages++;
      }
    }
    console.log(`Images: ${imgCount} total, ${brokenImages} broken`);
    
    await page.screenshot({ path: 'test-results/deep-homepage-full.png', fullPage: true });
    t.flush();
  });

  test('3. Search page with results', async ({ page }) => {
    const t = setupTelemetry(page, 'search-results');
    
    await page.goto(BASE + '/search', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(5000);
    
    // Check if search results appear or error is shown
    const body = await page.locator('body').innerText();
    console.log(`Search page length: ${body.length} chars`);
    
    // Look for lot cards or result items
    const resultCards = page.locator('[data-ai-id*="lot"], [data-ai-id*="card"], .card, [class*="card"]');
    const cardCount = await resultCards.count();
    console.log(`Search result cards: ${cardCount}`);
    
    // Check for "no results" message
    if (body.includes('Nenhum') || body.includes('No results') || body.includes('nenhum')) {
      console.log('[INFO] Search shows "no results" message');
    }
    
    await page.screenshot({ path: 'test-results/deep-search.png', fullPage: false });
    t.flush();
  });

  test('4. API health check', async ({ page }) => {
    const t = setupTelemetry(page, 'api-health');
    
    // Test API endpoints
    const apiRoutes = [
      '/api/health',
      '/api/tenants',
    ];
    
    for (const route of apiRoutes) {
      try {
        const response = await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const status = response?.status() ?? 0;
        const text = await page.locator('body').innerText().catch(() => 'N/A');
        console.log(`API ${route}: ${status} - ${text.substring(0, 200)}`);
      } catch (e: any) {
        console.log(`API ${route}: ERROR - ${e.message}`);
      }
    }
    
    t.flush();
  });

  test('5. Admin/backoffice pages (unauthenticated check)', async ({ page }) => {
    const t = setupTelemetry(page, 'admin-pages');
    
    // These should redirect to login or show 403
    const adminRoutes = [
      '/admin',
      '/admin/dashboard',
      '/admin/auctions',
      '/admin/lots',
    ];
    
    for (const route of adminRoutes) {
      try {
        const response = await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
        const status = response?.status() ?? 0;
        const finalUrl = page.url();
        console.log(`Admin ${route}: ${status} -> ${finalUrl}`);
        
        // Check if it has error boundary
        const hasError = await page.locator('text=Something went wrong').count();
        if (hasError > 0) {
          const errText = await page.locator('body').innerText();
          console.log(`[ERROR_BOUNDARY] ${route}: ${errText.substring(0, 300)}`);
        }
      } catch (e: any) {
        console.log(`Admin ${route}: TIMEOUT/ERROR - ${e.message.substring(0, 200)}`);
      }
    }
    
    t.flush();
  });

  test('6. Dynamic lot/auction pages', async ({ page }) => {
    const t = setupTelemetry(page, 'dynamic-pages');
    
    // Navigate to search first to find any lot links
    await page.goto(BASE + '/search', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(3000);
    
    // Try to find and click a lot link
    const lotLinks = page.locator('a[href*="/lot"], a[href*="/auction"], a[href*="/leilao"]');
    const linkCount = await lotLinks.count();
    console.log(`Found ${linkCount} lot/auction links`);
    
    if (linkCount > 0) {
      const href = await lotLinks.first().getAttribute('href');
      console.log(`Navigating to first lot: ${href}`);
      await lotLinks.first().click();
      await page.waitForTimeout(5000);
      
      const status = page.url();
      console.log(`Lot page URL: ${status}`);
      
      const hasError = await page.locator('text=Something went wrong').count();
      if (hasError > 0) {
        const errText = await page.locator('body').innerText();
        console.log(`[ERROR_BOUNDARY] Lot page: ${errText.substring(0, 500)}`);
      }
      
      await page.screenshot({ path: 'test-results/deep-lot-detail.png', fullPage: false });
    } else {
      console.log('[INFO] No lot/auction links found on search page');
    }
    
    t.flush();
  });

  test.afterAll(async () => {
    console.log('\n\n========== DEEP SMOKE TELEMETRY REPORT ==========');
    
    let totalConsoleErrors = 0;
    let totalNetworkFailures = 0;
    let totalPageErrors = 0;
    
    for (const entry of allConsoleErrors) {
      if (entry.errors.length > 0) {
        console.log(`\n[CONSOLE ERRORS] ${entry.test}:`);
        entry.errors.forEach(e => console.log(`  - ${e}`));
        totalConsoleErrors += entry.errors.length;
      }
    }
    
    for (const entry of allNetworkFailures) {
      if (entry.failures.length > 0) {
        console.log(`\n[NETWORK FAILURES] ${entry.test}:`);
        entry.failures.forEach(e => console.log(`  - ${e}`));
        totalNetworkFailures += entry.failures.length;
      }
    }
    
    for (const entry of allPageErrors) {
      if (entry.errors.length > 0) {
        console.log(`\n[PAGE ERRORS] ${entry.test}:`);
        entry.errors.forEach(e => console.log(`  - ${e}`));
        totalPageErrors += entry.errors.length;
      }
    }
    
    console.log(`\n--- TOTALS ---`);
    console.log(`Console Errors: ${totalConsoleErrors}`);
    console.log(`Network Failures: ${totalNetworkFailures}`);
    console.log(`Page Errors: ${totalPageErrors}`);
    console.log('========== END REPORT ==========\n');
  });
});
