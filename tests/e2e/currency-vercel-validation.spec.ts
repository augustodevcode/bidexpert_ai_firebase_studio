/**
 * @fileoverview Validates the BidExpert global currency feature on a live Vercel Preview deployment.
 *
 * This test bypasses Vercel's Deployment Protection (SSO) using the
 * x-vercel-protection-bypass header configured in playwright.currency-vercel.config.ts.
 *
 * Tests:
 *  1. Vercel deployment is reachable (bypass works)
 *  2. Currency rates API returns valid data
 *  3. Currency switch UI element is present in public pages
 *  4. BRL → USD switch changes displayed prices
 */

import { expect, test } from '@playwright/test';

const KNOWN_PUBLIC_ROUTES = ['/', '/search?type=lots', '/home-v2'];

test.describe('Currency Feature - Vercel Deployment Validation', () => {
  test.describe.configure({ mode: 'serial' });

  test('1. Vercel deployment is reachable via bypass header', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);

    const url = page.url();
    expect(url).not.toContain('vercel.com/login');
    expect(url).not.toContain('vercel.com/sso');

    await page.screenshot({ path: 'test-results/vercel-01-homepage-reachable.png' });
  });

  test('2. Currency rates API returns valid conversion data', async ({ request }) => {
    const ratesResponse = await request.get('/api/public/currency/rates?base=BRL&symbols=USD,EUR');
    expect(ratesResponse.ok()).toBeTruthy();

    const payload = await ratesResponse.json() as {
      base?: string;
      rates?: { USD?: number; EUR?: number; BRL?: number };
      source?: string;
    };

    expect(payload.base).toBe('BRL');
    expect(payload.rates).toBeDefined();
    expect(payload.rates!.USD).toBeGreaterThan(0);
    expect(payload.rates!.EUR).toBeGreaterThan(0);
    expect(payload.source).toBeDefined();
  });

  test('3. Currency switch element is visible on public pages', async ({ page }) => {
    let found = false;
    const routeResults: { route: string; visible: boolean }[] = [];

    for (const route of KNOWN_PUBLIC_ROUTES) {
      try {
        await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        const visible = await page
          .locator('[data-ai-id="header-currency-switch"]')
          .isVisible({ timeout: 10_000 })
          .catch(() => false);

        routeResults.push({ route, visible });
        if (visible) found = true;
      } catch {
        routeResults.push({ route, visible: false });
      }
    }

    console.log('Currency switch visibility per route:', JSON.stringify(routeResults, null, 2));
    expect(found).toBeTruthy();

    const visibleRoute = routeResults.find((r) => r.visible);
    if (visibleRoute) {
      await page.goto(visibleRoute.route, { waitUntil: 'domcontentloaded' });
    }

    await page.screenshot({ path: 'test-results/vercel-03-currency-switch-visible.png' });

    const currencySwitch = page.locator('[data-ai-id="header-currency-switch"]');
    await expect(currencySwitch).toBeVisible();

    const flagBrl = page.locator('[data-ai-id="currency-flag-brl"]');
    const flagVisible = await flagBrl.isVisible().catch(() => false);
    expect(flagVisible).toBeTruthy();
  });

  test('4. BRL → USD switch changes displayed prices', async ({ page }) => {
    // Navigate to a page with the currency switch
    let switchFound = false;
    for (const route of KNOWN_PUBLIC_ROUTES) {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      switchFound = await page
        .locator('[data-ai-id="header-currency-switch"]')
        .isVisible({ timeout: 10_000 })
        .catch(() => false);
      if (switchFound) break;
    }
    expect(switchFound).toBeTruthy();

    // Set currency to BRL via localStorage
    await page.evaluate(() => {
      window.localStorage.setItem('bidexpert:selected-currency', 'BRL');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    const currentLabel = page.locator('[data-ai-id="header-currency-current"]');
    const switchTrigger = page.locator('[data-ai-id="header-currency-switch"]');

    // Ensure BRL is selected
    const alreadyBrl = await currentLabel
      .textContent()
      .then((t) => t?.includes('BRL') ?? false)
      .catch(() => false);

    if (!alreadyBrl) {
      await switchTrigger.click({ timeout: 10_000 });
      await page
        .locator('[data-ai-id="header-currency-option-brl"]')
        .click({ timeout: 10_000, force: true });
    }

    await expect(currentLabel).toContainText('BRL');

    // Capture BRL price from promo text
    const promoTextBrl = await page
      .locator('[data-ai-id="header-promo-text"]')
      .innerText()
      .catch(() => '');

    await page.screenshot({ path: 'test-results/vercel-04a-brl-price.png' });

    // Switch to USD
    await page.evaluate(() => {
      window.localStorage.setItem('bidexpert:selected-currency', 'USD');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    const alreadyUsd = await currentLabel
      .textContent()
      .then((t) => t?.includes('USD') ?? false)
      .catch(() => false);

    if (!alreadyUsd) {
      await switchTrigger.click({ timeout: 10_000 });
      await page
        .locator('[data-ai-id="header-currency-option-usd"]')
        .click({ timeout: 10_000, force: true });
    }

    await expect(currentLabel).toContainText('USD');

    // Capture USD price from promo text
    const promoTextUsd = await page
      .locator('[data-ai-id="header-promo-text"]')
      .innerText()
      .catch(() => '');

    await page.screenshot({ path: 'test-results/vercel-04b-usd-price.png' });

    // If both promo texts were captured, they should differ
    if (promoTextBrl && promoTextUsd) {
      expect(promoTextBrl).not.toBe(promoTextUsd);
    }

    // Switch back to BRL to confirm round-trip
    await page.evaluate(() => {
      window.localStorage.setItem('bidexpert:selected-currency', 'BRL');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(currentLabel).toContainText('BRL');

    await page.screenshot({ path: 'test-results/vercel-04c-brl-restored.png' });
  });
});
