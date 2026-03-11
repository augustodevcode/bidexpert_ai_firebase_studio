import { test, expect } from './fixtures/browser-telemetry.fixture';
import { loginAsAdmin } from './helpers/auth-helper';

const NAVIGATION_TIMEOUT_MS = 15000;

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

function toScreenshotName(route: string, prefix = ''): string {
  const baseName = route.replace(/\//g, '-').replace(/^-+/, '') || 'home';
  return `${prefix}${baseName}`;
}

async function waitForPageReady(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await expect(page.locator('body')).toBeVisible({ timeout: NAVIGATION_TIMEOUT_MS });
  await page.waitForLoadState('load', { timeout: NAVIGATION_TIMEOUT_MS }).catch(() => {});
}

test.describe('Comprehensive Smoke Test - Admin Navigation', () => {
  test('should navigate through all specified screens', async ({ page }) => {
    test.setTimeout(8 * 60 * 1000);
    const failedRoutes: Array<{ route: string; reason: string }> = [];

    // 1. Visit Public Home
    console.log('Visiting Home Page...');
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
    await waitForPageReady(page);
    await page.screenshot({ path: 'smoke-screenshots/public-home.png', fullPage: true });

    // 2. Visit Login Page
    console.log('Visiting Login Page...');
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
    await waitForPageReady(page);
    await page.screenshot({ path: 'smoke-screenshots/login-page.png' });

    // 3. Perform Login
    console.log('Performing Login...');
    await loginAsAdmin(page, test.info().project.use.baseURL ?? 'http://demo.localhost:9006');
    await waitForPageReady(page);
    console.log('Login successful, on dashboard.');
    await page.screenshot({ path: 'smoke-screenshots/admin-dashboard.png', fullPage: true });

    // 4. Navigate Admin Routes
    for (const route of ADMIN_ROUTES) {
      console.log(`Navigating to ${route}...`);
      try {
        await page.goto(route, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
        await waitForPageReady(page);

        const screenshotName = toScreenshotName(route);
        await page.screenshot({ path: `smoke-screenshots/${screenshotName}.png`, fullPage: true });

        // Basic assertion to ensure page loaded
        const bodyText = await page.innerText('body');
        if (bodyText.includes('404') || bodyText.includes('Error')) {
          const reason = 'body returned 404/Error markers';
          failedRoutes.push({ route, reason });
          console.warn(`Warning: Route ${route} might have returned an error page.`);
        }
      } catch (error: unknown) {
        const reason = error instanceof Error ? error.message : String(error);
        failedRoutes.push({ route, reason });
        console.error(`Failed to navigate to ${route}:`, reason);
      }
    }

    // 5. Navigate Public Routes (while logged in)
    for (const route of PUBLIC_ROUTES) {
        if (route === '/') continue; // Already visited
        console.log(`Navigating to public route ${route}...`);
        try {
          await page.goto(route, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
          await waitForPageReady(page);
          const screenshotName = toScreenshotName(route, 'public-');
          await page.screenshot({ path: `smoke-screenshots/${screenshotName}.png`, fullPage: true });
        } catch (error: unknown) {
          const reason = error instanceof Error ? error.message : String(error);
          failedRoutes.push({ route, reason });
          console.error(`Failed to navigate to public route ${route}:`, reason);
        }
    }

    // 6. Test Search Interaction
    console.log('Testing search interaction in /admin/users...');
    try {
      await page.goto('/admin/users', { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
      await waitForPageReady(page);

      const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="Search"], [data-ai-id*="search-input"]').first();
      if (await searchInput.count()) {
          await searchInput.fill('admin');
          await searchInput.press('Enter');
          await waitForPageReady(page);
          await page.screenshot({ path: 'smoke-screenshots/admin-users-search.png', fullPage: true });
      } else {
          const reason = 'search input not found on /admin/users';
          failedRoutes.push({ route: '/admin/users#search', reason });
          console.log('Search input not found on /admin/users');
      }
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      failedRoutes.push({ route: '/admin/users#search', reason });
      console.error('Failed to exercise search on /admin/users:', reason);
    }

    if (failedRoutes.length > 0) {
      console.table(failedRoutes);
    }

    console.log('Comprehensive Smoke Test Completed.');
    expect(
      failedRoutes,
      `Routes with failures: ${failedRoutes.map(({ route, reason }) => `${route} => ${reason}`).join(' | ')}`
    ).toEqual([]);
  });
});
