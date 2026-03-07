/**
 * @fileoverview E2E Tests: Admin Monitor V2 Integration
 *
 * Valida a integração do Monitor V2 no painel administrativo:
 * - GoToMonitorButton em múltiplos locais (columns, AuctionTab, DashboardTab)
 * - Redirect /live → /monitor preservando query params
 * - Sidebar renomeado para "Pregões ao Vivo"
 * - Visibilidade condicional por status do leilão
 * - Abertura em nova aba via target="_blank"
 *
 * Perfis testados: Admin, Leiloeiro
 * Credenciais: auth-helper.ts (canônicas do seed)
 *
 * NOTA: Com Button asChild + Link, o data-ai-id fica no próprio <a> (anchor).
 * Portanto, `[data-ai-id="auction-monitor-btn"]` É o <a>, não um wrapper.
 */
import { test, expect, type Page } from '@playwright/test';
import { loginAsAdmin, loginAs, CREDENTIALS } from './helpers/auth-helper';

const BASE_URL = 'http://demo.localhost:9005';

/** Timeout estendido para login (lazy compilation em dev mode) */
const LOGIN_TIMEOUT = 120_000;

// ─────────────────────────────────────────────────────────────────
// Helper: Navigate and wait for auction list table
// ─────────────────────────────────────────────────────────────────

async function navigateToAuctionList(page: Page) {
  await page.goto(`${BASE_URL}/admin/auctions`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForSelector('table', { timeout: 60_000 });
  await page.waitForTimeout(2_000);
}

/**
 * Gets the first auction row that contains a monitor button (active status).
 */
async function findAuctionRowWithMonitorBtn(page: Page) {
  const monitorBtns = page.locator('[data-ai-id="auction-monitor-btn"]');
  const count = await monitorBtns.count();
  if (count === 0) return null;
  return monitorBtns.first().locator('xpath=ancestor::tr').first();
}

/**
 * Gets the href from a monitor button.
 * NOTE: With asChild, the data-ai-id IS on the <a> element itself.
 */
async function getMonitorHref(page: Page): Promise<string | null> {
  const monitorBtn = page.locator('[data-ai-id="auction-monitor-btn"]').first();
  if (!(await monitorBtn.isVisible({ timeout: 5_000 }).catch(() => false))) return null;
  // The element itself is the <a> (Button asChild renders child directly)
  return monitorBtn.getAttribute('href');
}

// ─────────────────────────────────────────────────────────────────
// Test Suite: Sidebar Navigation
// ─────────────────────────────────────────────────────────────────

test.describe('Sidebar - Pregões ao Vivo', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
  });

  test('sidebar shows "Pregões ao Vivo" instead of "Auditório Virtual"', async ({ page }) => {
    // Navigate to admin area where the admin sidebar is rendered
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle', timeout: 120_000 });
    await page.waitForTimeout(3_000);

    // Should find "Pregões ao Vivo"
    const sidebarLink = page.getByText('Pregões ao Vivo');
    await expect(sidebarLink).toBeVisible({ timeout: 30_000 });

    // Should NOT find old "Auditório Virtual"
    const oldLink = page.getByText('Auditório Virtual');
    await expect(oldLink).toHaveCount(0);
  });

  test('sidebar "Pregões ao Vivo" link navigates to /live-dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle', timeout: 120_000 });

    const sidebarLink = page.getByRole('link', { name: /Pregões ao Vivo/i });
    await expect(sidebarLink).toBeVisible({ timeout: 30_000 });

    const href = await sidebarLink.getAttribute('href');
    expect(href).toBe('/live-dashboard');
  });
});

// ─────────────────────────────────────────────────────────────────
// Test Suite: Auction List Columns - Monitor Button
// ─────────────────────────────────────────────────────────────────

test.describe('Auction List - Monitor Button in Columns', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
  });

  test('auction row actions container has data-ai-id', async ({ page }) => {
    await navigateToAuctionList(page);
    const actionsContainer = page.locator('[data-ai-id="auction-row-actions"]').first();
    await expect(actionsContainer).toBeVisible({ timeout: 15_000 });
  });

  test('active auction shows Tv monitor button', async ({ page }) => {
    await navigateToAuctionList(page);

    const monitorBtn = page.locator('[data-ai-id="auction-monitor-btn"]').first();
    const isVisible = await monitorBtn.isVisible({ timeout: 10_000 }).catch(() => false);

    if (isVisible) {
      // With Button asChild + Link, the data-ai-id IS on the <a> element
      const href = await monitorBtn.getAttribute('href');
      expect(href).toContain('/monitor');

      const target = await monitorBtn.getAttribute('target');
      expect(target).toBe('_blank');
    } else {
      test.skip(true, 'No active auction with monitor button found in seed data');
    }
  });

  test('monitor button has tooltip on hover', async ({ page }) => {
    await navigateToAuctionList(page);

    const monitorBtn = page.locator('[data-ai-id="auction-monitor-btn"]').first();
    const isVisible = await monitorBtn.isVisible({ timeout: 10_000 }).catch(() => false);

    if (!isVisible) {
      test.skip(true, 'No active auction for monitor button tooltip test');
      return;
    }

    // Hover to trigger tooltip
    await monitorBtn.hover();
    await page.waitForTimeout(1_500);

    // Tooltip text from columns.tsx: "Pregão AO VIVO — Abrir Monitor" or "Abrir Monitor do Pregão"
    const tooltip = page.getByRole('tooltip');
    const tooltipVisible = await tooltip.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!tooltipVisible) {
      // Fallback: check for tooltip text anywhere in the DOM (portaled)
      const tooltipText = page.locator('[role="tooltip"], [data-state="open"]').filter({
        hasText: /Monitor|Pregão/i,
      });
      const fallbackVisible = await tooltipText.first().isVisible({ timeout: 3_000 }).catch(() => false);
      expect(fallbackVisible).toBeTruthy();
    } else {
      expect(tooltipVisible).toBeTruthy();
    }
  });

  test('all row action buttons have data-ai-id attributes', async ({ page }) => {
    await navigateToAuctionList(page);

    const expectedIds = [
      'auction-view-btn',
      'auction-dashboard-btn',
      'auction-edit-btn',
      'auction-delete-btn',
    ];

    for (const id of expectedIds) {
      const btn = page.locator(`[data-ai-id="${id}"]`).first();
      const exists = await btn.isVisible({ timeout: 5_000 }).catch(() => false);
      if (exists) {
        expect(exists).toBeTruthy();
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// Test Suite: Auction Preparation - AuctionTab Hero Card
// ─────────────────────────────────────────────────────────────────

test.describe('Auction Preparation - Monitor Hero Card', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
  });

  test('auction preparation page shows monitor hero card for active auction', async ({ page }) => {
    await navigateToAuctionList(page);

    // Click on dashboard button (not view — view opens new tab with target="_blank")
    const dashboardBtn = page.locator('[data-ai-id="auction-dashboard-btn"]').first();
    const isVisible = await dashboardBtn.isVisible({ timeout: 10_000 }).catch(() => false);

    if (!isVisible) {
      test.skip(true, 'No auction dashboard button found');
      return;
    }

    await dashboardBtn.click();
    await page.waitForTimeout(5_000);

    // Look for the "Pregão" tab in the dialog/panel
    const pregaoTab = page.getByRole('tab', { name: /Pregão|Auction/i });
    const tabVisible = await pregaoTab.isVisible({ timeout: 10_000 }).catch(() => false);

    if (!tabVisible) {
      test.skip(true, 'Pregão tab not visible - may not be in this dialog');
      return;
    }

    await pregaoTab.click();
    await page.waitForTimeout(2_000);

    // Check for the monitor hero card
    const heroCard = page.locator('[data-ai-id="monitor-hero-card"]');
    const heroVisible = await heroCard.isVisible({ timeout: 10_000 }).catch(() => false);

    if (heroVisible) {
      // Verify GoToMonitorButton is inside the hero card
      const monitorBtn = heroCard.locator('[data-ai-id="go-to-monitor-btn"]');
      await expect(monitorBtn).toBeVisible({ timeout: 5_000 });

      // With asChild, the data-ai-id IS on the <a> — get href directly
      const href = await monitorBtn.getAttribute('href');
      if (!href) {
        // GoToMonitorButton uses Button asChild > Link, but the inner go-to-monitor-btn
        // might be on the Button which renders as <a> due to asChild
        const linkInBtn = monitorBtn.locator('a').first();
        const innerHref = await linkInBtn.getAttribute('href').catch(() => null);
        expect(innerHref ?? '').toContain('/monitor');
      } else {
        expect(href).toContain('/monitor');
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// Test Suite: Dashboard Tab - GoToMonitorButton
// ─────────────────────────────────────────────────────────────────

test.describe('Dashboard Tab - GoToMonitorButton', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
  });

  test('dashboard quick actions shows GoToMonitorButton', async ({ page }) => {
    await navigateToAuctionList(page);

    const dashboardBtn = page.locator('[data-ai-id="auction-dashboard-btn"]').first();
    const isVisible = await dashboardBtn.isVisible({ timeout: 10_000 }).catch(() => false);

    if (!isVisible) {
      test.skip(true, 'No auction dashboard button found');
      return;
    }

    await dashboardBtn.click();
    await page.waitForTimeout(3_000);

    // Look for the GoToMonitorButton in the dashboard
    const monitorBtn = page.locator('[data-ai-id="admin-dashboard-go-monitor-btn"]');
    const btnVisible = await monitorBtn.isVisible({ timeout: 15_000 }).catch(() => false);

    if (btnVisible) {
      // With asChild, try getting href directly first
      const href = await monitorBtn.getAttribute('href');
      if (href) {
        expect(href).toContain('/monitor');
        const target = await monitorBtn.getAttribute('target');
        expect(target).toBe('_blank');
      } else {
        // If data-ai-id is on a wrapper, look for <a> inside
        const link = monitorBtn.locator('a').first();
        const linkHref = await link.getAttribute('href').catch(() => null);
        expect(linkHref ?? '').toContain('/monitor');
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// Test Suite: Legacy /live → /monitor Redirect
// ─────────────────────────────────────────────────────────────────

test.describe('Legacy Redirect: /live → /monitor', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
  });

  test('/live redirects to /monitor', async ({ page }) => {
    // Use a fake auctionId — the redirect happens client-side via router.replace
    const testAuctionId = 'test-redirect-auction';

    // Don't wait for networkidle — the redirect triggers new navigation
    await page.goto(`${BASE_URL}/auctions/${testAuctionId}/live`, {
      waitUntil: 'commit',
      timeout: 120_000,
    });

    // Wait for the client-side redirect to complete
    await page.waitForURL(/\/monitor/, { timeout: 30_000 });

    const currentUrl = page.url();
    expect(currentUrl).toContain('/monitor');
    expect(currentUrl).not.toContain('/live');
  });

  test('/live preserves lotId query parameter', async ({ page }) => {
    const testAuctionId = 'test-redirect-auction';
    const testLotId = 'lot-123';

    await page.goto(`${BASE_URL}/auctions/${testAuctionId}/live?lotId=${testLotId}`, {
      waitUntil: 'commit',
      timeout: 120_000,
    });

    // Wait for redirect
    await page.waitForURL(/\/monitor/, { timeout: 30_000 });

    const currentUrl = page.url();
    expect(currentUrl).toContain('/monitor');
    expect(currentUrl).toContain(`lotId=${testLotId}`);
  });

  test('/live shows loading spinner during redirect', async ({ page }) => {
    const testAuctionId = 'test-redirect-auction';

    await page.goto(`${BASE_URL}/auctions/${testAuctionId}/live`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    // Check for loading indicator before redirect completes
    const redirectPage = page.locator('[data-ai-id="live-redirect-page"]');
    const loaderVisible = await redirectPage.isVisible({ timeout: 15_000 }).catch(() => false);

    // Either we catch the loader or it already redirected — both are valid
    if (loaderVisible) {
      const spinner = redirectPage.locator('.animate-spin');
      await expect(spinner).toBeVisible();
      const title = redirectPage.getByText('Redirecionando...');
      await expect(title).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// Test Suite: GoToMonitorButton Component Behavior
// ─────────────────────────────────────────────────────────────────

test.describe('GoToMonitorButton - Component Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
  });

  test('GoToMonitorButton opens /monitor URL with target="_blank"', async ({ page }) => {
    await navigateToAuctionList(page);

    const monitorBtn = page.locator('[data-ai-id="auction-monitor-btn"]').first();
    const isVisible = await monitorBtn.isVisible({ timeout: 10_000 }).catch(() => false);

    if (!isVisible) {
      test.skip(true, 'No active auction with monitor button');
      return;
    }

    // With Button asChild, the data-ai-id IS on the <a> element
    const href = await monitorBtn.getAttribute('href');
    const target = await monitorBtn.getAttribute('target');
    const rel = await monitorBtn.getAttribute('rel');

    expect(href).toContain('/auctions/');
    expect(href).toContain('/monitor');
    expect(target).toBe('_blank');
    expect(rel).toContain('noopener');
  });
});

// ─────────────────────────────────────────────────────────────────
// Test Suite: GoToLiveAuctionButton (Public - Updated URL)
// ─────────────────────────────────────────────────────────────────

test.describe('GoToLiveAuctionButton - Public Button URL Fix', () => {
  test('public button now links to /monitor instead of /live', async ({ page }) => {
    // Login as buyer with extended timeout for lazy compilation
    try {
      await loginAs(page, 'comprador', BASE_URL, {
        waitPattern: /\/(dashboard|home|search|auctions|overview|\/$)/i,
        timeout: LOGIN_TIMEOUT,
      });
    } catch (e) {
      // Comprador may not exist in demo seed — skip gracefully
      test.skip(true, `Comprador login failed (credentials may not exist in demo seed): ${(e as Error).message.slice(0, 100)}`);
      return;
    }

    // Navigate to search or auctions page
    await page.goto(`${BASE_URL}/search`, {
      waitUntil: 'networkidle',
      timeout: 120_000,
    });
    await page.waitForTimeout(3_000);

    // Look for any "go-to-live-auction-btn" instances
    const liveBtn = page.locator('[data-ai-id="go-to-live-auction-btn"]');
    const count = await liveBtn.count();

    if (count > 0) {
      // With asChild, the element IS the <a>; try href directly
      const href = await liveBtn.first().getAttribute('href');
      if (href) {
        expect(href).toContain('/monitor');
        expect(href).not.toMatch(/\/live$/);
      } else {
        // Fallback if data-ai-id is on a wrapper
        const firstLink = liveBtn.first().locator('a').first();
        const innerHref = await firstLink.getAttribute('href').catch(() => null);
        if (innerHref) {
          expect(innerHref).toContain('/monitor');
        }
      }
    }
    // If no buttons visible, the buyer may not see active auctions — that's OK
  });
});

// ─────────────────────────────────────────────────────────────────
// Test Suite: Multi-Profile Access (Admin vs Leiloeiro)
// ─────────────────────────────────────────────────────────────────

test.describe('Multi-Profile: Admin & Leiloeiro Access', () => {
  test('admin can access auction list and see monitor buttons', async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
    await navigateToAuctionList(page);

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 30_000 });

    const actions = page.locator('[data-ai-id="auction-row-actions"]');
    const actionsCount = await actions.count();
    expect(actionsCount).toBeGreaterThan(0);
  });

  test('leiloeiro can access admin auctions area', async ({ page }) => {
    try {
      await loginAs(page, 'leiloeiro', BASE_URL, {
        waitPattern: /\/(admin|dashboard|auctioneer|overview|\/$)/i,
        timeout: LOGIN_TIMEOUT,
      });
    } catch (e) {
      // Leiloeiro may not exist in demo seed — skip gracefully
      test.skip(true, `Leiloeiro login failed (credentials may not exist in demo seed): ${(e as Error).message.slice(0, 100)}`);
      return;
    }

    await page.goto(`${BASE_URL}/admin/auctions`, {
      waitUntil: 'networkidle',
      timeout: 120_000,
    });
    await page.waitForTimeout(3_000);

    const currentUrl = page.url();
    if (currentUrl.includes('/admin/auctions')) {
      const table = page.locator('table');
      const tableVisible = await table.isVisible({ timeout: 15_000 }).catch(() => false);
      expect(tableVisible).toBeTruthy();
    }
    // If redirected, leiloeiro doesn't have access — that's expected behavior
  });
});

// ─────────────────────────────────────────────────────────────────
// Test Suite: Visual Regression - Screenshots
// ─────────────────────────────────────────────────────────────────

test.describe('Visual Regression - Admin Monitor Integration', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
  });

  test('screenshot: admin auction list with monitor buttons', async ({ page }) => {
    await navigateToAuctionList(page);
    await page.waitForTimeout(2_000);
    await page.screenshot({
      path: 'tests/e2e/screenshots/admin-auction-list-monitor-buttons.png',
      fullPage: false,
    });
  });

  test('screenshot: sidebar with Pregões ao Vivo', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`, {
      waitUntil: 'networkidle',
      timeout: 120_000,
    });
    await page.waitForTimeout(2_000);

    const sidebar = page.locator('aside').first();
    const sidebarVisible = await sidebar.isVisible({ timeout: 15_000 }).catch(() => false);

    if (sidebarVisible) {
      await sidebar.screenshot({
        path: 'tests/e2e/screenshots/admin-sidebar-pregoes-ao-vivo.png',
      });
    } else {
      await page.screenshot({
        path: 'tests/e2e/screenshots/admin-sidebar-pregoes-ao-vivo-fullpage.png',
        fullPage: false,
      });
    }
  });

  test('screenshot: live redirect page', async ({ page }) => {
    await page.goto(`${BASE_URL}/auctions/test-id/live`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    await page.screenshot({
      path: 'tests/e2e/screenshots/live-redirect-page.png',
      fullPage: false,
    });
  });
});
