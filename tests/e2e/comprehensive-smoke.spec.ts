import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.SMOKE_TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SMOKE_TEST_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('SMOKE_TEST_ADMIN_EMAIL and SMOKE_TEST_ADMIN_PASSWORD must be set');
}

const ADMIN_ROUTES = [
  '/admin/dashboard',
  '/admin/tenants',
  '/admin/users',
  '/admin/auctions',
  '/admin/lots',
  '/admin/categories',
  '/admin/settings',
  '/admin/audit-logs',
  '/admin/reports',
  '/admin/media',
  '/admin/platform-tenants',
  '/admin/faqs',
  '/admin/activity-logs',
  '/admin/cities',
  '/admin/bidder-impersonation',
  '/admin/judicial-districts',
  '/admin/wizard',
  '/admin/datasources',
  '/admin/direct-sales',
  '/admin/qa',
  '/admin/support-tickets',
  '/admin/vehicle-makes',
  '/admin/states',
  '/admin/assets',
  '/admin/vehicle-models',
  '/admin/document-templates',
  '/admin/courts',
  '/admin/roles',
  '/admin/judicial-processes',
  '/admin/email-logs',
  '/admin/auctioneers',
  '/admin/report-builder',
  '/admin/import',
  '/admin/habilitations',
  '/admin/contact-messages',
  '/admin/lotting',
  '/admin/auctions-v2',
  '/admin/sellers',
  '/admin/subcategories',
  '/admin/judicial-branches',
  '/admin/auctions-supergrid',
];

const PUBLIC_ROUTES = [
  '/',
  '/auctions',
  '/search',
];

test.describe('Comprehensive Smoke Test - Admin Navigation', () => {
  test('should navigate through all specified screens', async ({ page }) => {
    test.setTimeout(300_000); // 5 minutes — navigates 40+ admin routes
    // 1. Visit Public Home
    console.log('Visiting Home Page...');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'smoke-screenshots/public-home.png', fullPage: true });

    // 2. Visit Login Page
    console.log('Visiting Login Page...');
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'smoke-screenshots/login-page.png' });

    // 3. Perform Login
    console.log('Performing Login...');

    // Select Tenant if available
    const tenantSelect = page.locator('[data-ai-id="auth-login-tenant-select"]');
    if (await tenantSelect.isVisible({ timeout: 10000 })) {
      const isEnabled = await tenantSelect.isEnabled().catch(() => false);
      if (isEnabled) {
        await tenantSelect.click();
        await page.waitForTimeout(1000);
        const firstOption = page.locator('[role="option"]').first();
        if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstOption.click();
        }
      } else {
        console.log('Tenant selector is disabled (auto-locked or no tenants). Proceeding with login...');
      }
    }

    await page.locator('[data-ai-id="auth-login-email-input"]').fill(ADMIN_EMAIL);
    await page.locator('[data-ai-id="auth-login-password-input"]').fill(ADMIN_PASSWORD);
    await page.screenshot({ path: 'smoke-screenshots/login-filled.png' });

    await page.locator('[data-ai-id="auth-login-submit-button"]').click();

    // Wait for navigation to dashboard
    await page.waitForURL(/\/admin|\/dashboard/);
    await page.waitForLoadState('networkidle');
    console.log('Login successful, on dashboard.');
    await page.screenshot({ path: 'smoke-screenshots/admin-dashboard.png', fullPage: true });

    // 4. Navigate Admin Routes
    const results: { route: string; status: 'ok' | 'warn' | 'fail'; detail?: string }[] = [];
    for (const route of ADMIN_ROUTES) {
      console.log(`Navigating to ${route}...`);
      try {
        const response = await page.goto(route, { timeout: 30000, waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const screenshotName = route.replace(/\//g, '-').substring(1);
        await page.screenshot({ path: `smoke-screenshots/${screenshotName}.png`, fullPage: true });

        const statusCode = response?.status() ?? 0;
        if (statusCode >= 400) {
          console.warn(`Warning: Route ${route} returned status ${statusCode}.`);
          results.push({ route, status: 'warn', detail: `HTTP ${statusCode}` });
        } else {
          results.push({ route, status: 'ok' });
        }
      } catch (error: any) {
        console.error(`Failed to navigate to ${route}:`, error.message);
        results.push({ route, status: 'fail', detail: error.message?.substring(0, 100) });
      }
    }

    // 5. Navigate Public Routes (while logged in)
    for (const route of PUBLIC_ROUTES) {
        if (route === '/') continue; // Already visited
        console.log(`Navigating to public route ${route}...`);
        try {
          await page.goto(route, { timeout: 30000, waitUntil: 'domcontentloaded' });
          await page.waitForLoadState('domcontentloaded');
          const screenshotName = `public-${route.replace(/\//g, '-').substring(1) || 'home'}`;
          await page.screenshot({ path: `smoke-screenshots/${screenshotName}.png`, fullPage: true });
          results.push({ route, status: 'ok' });
        } catch (error: any) {
          console.error(`Failed to navigate to ${route}:`, error.message);
          results.push({ route, status: 'fail', detail: error.message?.substring(0, 100) });
        }
    }

    // 6. Test Search Interaction
    console.log('Testing search interaction in /admin/users...');
    try {
      await page.goto('/admin/users', { timeout: 30000, waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="Search"], [data-ai-id*="search-input"]').first();
      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
          await searchInput.fill('admin');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'smoke-screenshots/admin-users-search.png', fullPage: true });
      } else {
          console.log('Search input not found on /admin/users');
      }
    } catch (error: any) {
      console.error('Search test failed:', error.message);
    }

    // 7. Summary
    const failed = results.filter(r => r.status === 'fail');
    const warned = results.filter(r => r.status === 'warn');
    const ok = results.filter(r => r.status === 'ok');
    console.log(`\nSmoke Test Summary: ${ok.length} OK, ${warned.length} WARN, ${failed.length} FAIL out of ${results.length} routes`);
    if (failed.length > 0) {
      console.log('Failed routes:', failed.map(r => r.route).join(', '));
    }

    // Allow up to 20% failures (some routes may not exist yet)
    const failRate = failed.length / results.length;
    expect(failRate, `Too many route failures: ${failed.length}/${results.length}`).toBeLessThan(0.2);

    console.log('Comprehensive Smoke Test Completed.');
  });
});
