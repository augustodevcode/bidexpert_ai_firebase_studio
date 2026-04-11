/**
 * @fileoverview E2E tests for the public /lots page.
 *
 * Validates rendering of grouped lot categories (Judicial, Extrajudicial,
 * Venda Direta, Tomada de Preços) using AuctionLotCardV2 components.
 *
 * BDD Scenarios:
 * - Given a visitor navigates to /lots
 *   When the page loads
 *   Then the heading "Lotes em Leilão" is visible
 *   And at least one category section is rendered with lot cards
 *
 * - Given lot cards are rendered
 *   When the visitor inspects a card
 *   Then it contains gallery, title, location, pricing, timeline, and CTA
 *
 * - Given the /lots page is rendered
 *   When the visitor clicks "DAR LANCE" on a card
 *   Then the browser navigates to the lot detail page
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://demo.localhost:9014';

function withinTolerance(values: number[], tolerance = 2) {
  return Math.max(...values) - Math.min(...values) <= tolerance;
}

test.describe('Public /lots Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/lots`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  });

  // ── Page structure ──────────────────────────────────────────────────

  test('should render page heading and summary', async ({ page }) => {
    const heading = page.locator('[data-ai-id="lots-page-heading"]');
    await expect(heading).toBeVisible({ timeout: 30_000 });
    await expect(heading).toHaveText('Lotes em Leilão');

    // Summary line should show count and categories
    const header = page.locator('[data-ai-id="lots-page-header"]');
    await expect(header.locator('p')).toContainText(/\d+ lotes encontrados em \d+ categorias/);
  });

  test('should render at least one category section with lot cards', async ({ page }) => {
    const sections = [
      'lots-section-judicial',
      'lots-section-extrajudicial',
      'lots-section-venda-direta',
      'lots-section-tomada-de-precos',
    ];

    let visibleSections = 0;

    for (const sectionId of sections) {
      const section = page.locator(`[data-ai-id="${sectionId}"]`);
      if (await section.isVisible()) {
        visibleSections++;
        // Each visible section must contain at least one card
        const cards = section.locator('[data-ai-id="auction-lot-card-v2"]');
        await expect(cards.first()).toBeVisible({ timeout: 10_000 });
      }
    }

    expect(visibleSections).toBeGreaterThanOrEqual(1);
  });

  test('should NOT show empty state when lots exist', async ({ page }) => {
    const emptyState = page.locator('[data-ai-id="lots-empty-state"]');
    await expect(emptyState).not.toBeVisible();
  });

  // ── Card anatomy ────────────────────────────────────────────────────

  test('card should contain all required sub-sections', async ({ page }) => {
    const firstCard = page.locator('[data-ai-id="auction-lot-card-v2"]').first();
    await expect(firstCard).toBeVisible({ timeout: 30_000 });

    // Gallery with image
    const gallery = firstCard.locator('[data-ai-id="card-v2-gallery"]');
    await expect(gallery).toBeVisible();
    await expect(gallery.locator('img').first()).toBeVisible();

    // Header with title
    const title = firstCard.locator('[data-ai-id="card-v2-title"]');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText?.trim().length).toBeGreaterThan(0);

    // Location
    const location = firstCard.locator('[data-ai-id="card-v2-location"]');
    await expect(location).toBeVisible();

    // KPI row (visits, qualified, bids)
    const kpi = firstCard.locator('[data-ai-id="card-v2-kpi"]');
    await expect(kpi).toBeVisible();

    // Pricing
    const pricing = firstCard.locator('[data-ai-id="card-v2-pricing"]');
    await expect(pricing).toBeVisible();
    await expect(pricing).toContainText(/R\$/);

    // Timeline
    const timeline = firstCard.locator('[data-ai-id="card-v2-timeline"]');
    await expect(timeline).toBeVisible();

    // Actions with CTA
    const actions = firstCard.locator('[data-ai-id="card-v2-actions"]');
    await expect(actions).toBeVisible();
    const cta = firstCard.locator('[data-ai-id="card-v2-cta"]');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText(/DAR LANCE/i);
  });

  // ── Judicial section detail ─────────────────────────────────────────

  test('Judicial section should show section title and badge count', async ({ page }) => {
    const judicial = page.locator('[data-ai-id="lots-section-judicial"]');
    if (!(await judicial.isVisible())) {
      test.skip();
      return;
    }

    // Section heading
    await expect(judicial.getByRole('heading', { level: 2 })).toHaveText('Leilões Judiciais');

    // Badge with count (number inside a span/badge next to heading)
    const badge = judicial.locator('h2 + span, h2 ~ span').first();
    const badgeText = await badge.textContent();
    expect(Number(badgeText?.trim())).toBeGreaterThan(0);
  });

  // ── Navigation (CTA click) ─────────────────────────────────────────

  test('clicking "DAR LANCE" should navigate to lot detail', async ({ page }) => {
    const firstCta = page.locator('[data-ai-id="card-v2-cta"]').first();
    await expect(firstCta).toBeVisible({ timeout: 30_000 });

    const href = await firstCta.getAttribute('href');
    expect(href).toMatch(/\/lots\/\d+/);

    // CTA links to /lots/:id which may redirect to /auctions/:id/lots/:slug
    await firstCta.click({ noWaitAfter: true });
    // Wait for any navigation away from /lots listing page
    await page.waitForURL((url) => !url.pathname.endsWith('/lots'), { timeout: 90_000 });
    const finalUrl = page.url();
    expect(finalUrl).toMatch(/\/(lots\/\d+|auctions\/\d+\/lots\/)/);
  });

  // ── Responsive grid ─────────────────────────────────────────────────

  test('cards should be in a responsive grid layout', async ({ page }) => {
    // At desktop viewport, there should be multiple cards per row
    const section = page.locator('[data-ai-id="lots-section-judicial"], [data-ai-id="lots-section-extrajudicial"]').first();
    if (!(await section.isVisible())) {
      test.skip();
      return;
    }

    const cards = section.locator('[data-ai-id="auction-lot-card-v2"]');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Cards should have non-zero dimensions
    const firstCardBox = await cards.first().boundingBox();
    expect(firstCardBox).not.toBeNull();
    expect(firstCardBox!.width).toBeGreaterThan(200);
    expect(firstCardBox!.height).toBeGreaterThan(200);
  });

  test('search lot grid should keep title shell and action footer aligned', async ({ page }) => {
    await page.goto(`${BASE}/search?type=lots`, { waitUntil: 'domcontentloaded', timeout: 120_000 });

    const grid = page.locator('[data-ai-id="search-results-grid"]');
    await expect(grid).toBeVisible({ timeout: 30_000 });

    const cards = grid.locator('[data-ai-id="auction-lot-card-v2"]');
    await expect(cards.first()).toBeVisible({ timeout: 30_000 });

    const metrics = await cards.evaluateAll((nodes) =>
      nodes.slice(0, 4).map((node) => {
        const cardRect = node.getBoundingClientRect();
        const titleShell = node.querySelector('[data-ai-id="card-v2-title-shell"]')?.getBoundingClientRect();
        const processSlot = node.querySelector('[data-ai-id="card-v2-process-slot"]')?.getBoundingClientRect();
        const actions = node.querySelector('[data-ai-id="card-v2-actions"]')?.getBoundingClientRect();

        return {
          titleShellHeight: titleShell ? Math.round(titleShell.height) : 0,
          processSlotHeight: processSlot ? Math.round(processSlot.height) : 0,
          footerBottomGap: actions ? Math.round(cardRect.bottom - actions.bottom) : 999,
        };
      }),
    );

    expect(metrics.length).toBeGreaterThanOrEqual(2);
    expect(withinTolerance(metrics.map((metric) => metric.titleShellHeight))).toBe(true);
    expect(withinTolerance(metrics.map((metric) => metric.processSlotHeight))).toBe(true);
    expect(withinTolerance(metrics.map((metric) => metric.footerBottomGap))).toBe(true);
  });

  // ── Accessibility basics ────────────────────────────────────────────

  test('page should have proper heading hierarchy', async ({ page }) => {
    // Single h1
    const h1s = page.getByRole('heading', { level: 1 });
    await expect(h1s).toHaveCount(1);

    // h2s for category sections
    const h2s = page.locator('[data-ai-id^="lots-section-"] h2');
    const h2Count = await h2s.count();
    expect(h2Count).toBeGreaterThanOrEqual(1);

    // h3s for card titles
    const h3s = page.locator('[data-ai-id="card-v2-title"]');
    const h3Count = await h3s.count();
    expect(h3Count).toBeGreaterThanOrEqual(1);
  });

  test('CTA links should have accessible text', async ({ page }) => {
    const ctas = page.locator('[data-ai-id="card-v2-cta"]');
    const firstCta = ctas.first();
    await expect(firstCta).toBeVisible({ timeout: 30_000 });

    // CTA should be an anchor with text
    const text = await firstCta.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);

    // Should have href
    const href = await firstCta.getAttribute('href');
    expect(href).toBeTruthy();
  });
});
