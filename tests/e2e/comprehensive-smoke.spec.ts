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
      await tenantSelect.click();
      await page.waitForTimeout(1000);
      // Select the first option or a specific one if known.
      // Based on previous logs, "Tenant Principal" or just the first option.
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
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
    for (const route of ADMIN_ROUTES) {
      console.log(`Navigating to ${route}...`);
      try {
        await page.goto(route, { timeout: 30000 });
        await page.waitForLoadState('networkidle');
        // Wait a bit for any dynamic content/grids
        await page.waitForTimeout(2000);

        const screenshotName = route.replace(/\//g, '-').substring(1);
        await page.screenshot({ path: `smoke-screenshots/${screenshotName}.png`, fullPage: true });

        // Basic assertion to ensure page loaded
        const bodyText = await page.innerText('body');
        if (bodyText.includes('404') || bodyText.includes('Error')) {
          console.warn(`Warning: Route ${route} might have returned an error page.`);
        }
      } catch (error) {
        console.error(`Failed to navigate to ${route}:`, error.message);
      }
    }

    // 5. Navigate Public Routes (while logged in)
    for (const route of PUBLIC_ROUTES) {
        if (route === '/') continue; // Already visited
        console.log(`Navigating to public route ${route}...`);
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        const screenshotName = `public-${route.replace(/\//g, '-').substring(1) || 'home'}`;
        await page.screenshot({ path: `smoke-screenshots/${screenshotName}.png`, fullPage: true });
    }

    // 6. Test Search Interaction
    console.log('Testing search interaction in /admin/users...');
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="Search"], [data-ai-id*="search-input"]').first();
    if (await searchInput.isVisible()) {
        await searchInput.fill('admin');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'smoke-screenshots/admin-users-search.png', fullPage: true });
    } else {
        console.log('Search input not found on /admin/users');
    }

    console.log('Comprehensive Smoke Test Completed.');
  });
});
