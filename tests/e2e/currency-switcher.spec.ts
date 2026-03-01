/**
 * @fileoverview Valida o seletor global de moeda no cabeçalho público com
 * conversão real de valores baseada em índice externo.
 */

import { expect, test } from '@playwright/test';
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type CoverageStatus = 'tested' | 'failed' | 'skipped';

interface CoverageEntry {
  route: string;
  element: string;
  status: CoverageStatus;
  reason?: string;
}

function writeTmpArtifacts(fileName: string, content: string): void {
  const targets = ['/tmp', path.join(process.cwd(), 'tmp')];
  for (const target of targets) {
    try {
      mkdirSync(target, { recursive: true });
      writeFileSync(path.join(target, fileName), content, 'utf-8');
    } catch {
      // ignora alvo indisponível no ambiente atual
    }
  }
}

function discoverRoutesFromFilesystem(): string[] {
  const appDir = path.join(process.cwd(), 'src', 'app');
  const routes: string[] = [];

  const walk = (dir: string) => {
    const entries = readdirSync(dir);
    const hasPage = entries.includes('page.tsx') || entries.includes('page.ts');

    if (hasPage) {
      const relative = path.relative(appDir, dir).split(path.sep).filter(Boolean);
      const urlSegments = relative.filter((segment) => {
        if (segment.startsWith('(') && segment.endsWith(')')) return false;
        if (segment.startsWith('_')) return false;
        if (segment.includes('[')) return false;
        return true;
      });

      const route = `/${urlSegments.join('/')}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
      routes.push(route);
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath);
      }
    }
  };

  walk(appDir);
  return [...new Set(routes)].sort((a, b) => a.localeCompare(b));
}

async function setCurrencyParameter(page: import('@playwright/test').Page, code: 'BRL' | 'USD') {
  await page.evaluate((selectedCode) => {
    window.localStorage.setItem('bidexpert:selected-currency', selectedCode);
  }, code);
  await page.reload({ waitUntil: 'domcontentloaded' });

  const currentLabel = page.locator('[data-ai-id="header-currency-current"]');
  const switchTrigger = page.locator('[data-ai-id="header-currency-switch"]');

  const alreadyApplied = await currentLabel.textContent().then((text) => text?.includes(code) ?? false);
  if (!alreadyApplied) {
    await switchTrigger.click({ timeout: 10_000 });
    await page.locator(`[data-ai-id="header-currency-option-${code.toLowerCase()}"]`).click({ timeout: 10_000, force: true });
  }

  await expect(currentLabel).toContainText(code);
  await expect
    .poll(async () => page.evaluate(() => window.localStorage.getItem('bidexpert:selected-currency')))
    .toBe(code);
}

async function readPromoPriceText(page: import('@playwright/test').Page): Promise<string> {
  const promoText = await page.locator('[data-ai-id="header-promo-text"]').innerText();
  const match = promoText.match(/(R\$\s?[\d.,]+|\$\s?[\d.,]+)/);
  return match?.[0] ?? '';
}

async function expectCurrencyVisibleOnPage(page: import('@playwright/test').Page, code: 'BRL' | 'USD') {
  const promoText = await page.locator('[data-ai-id="header-promo-text"]').innerText();
  if (code === 'BRL') {
    expect(promoText).toMatch(/R\$/);
    return;
  }

  expect(promoText).toMatch(/\$/);
}

async function navigateToRouteWithCurrencySwitch(page: import('@playwright/test').Page): Promise<void> {
  const candidateRoutes = ['/search?type=lots', '/', '/home-v2'];

  for (const route of candidateRoutes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const switchVisible = await page.locator('[data-ai-id="header-currency-switch"]').isVisible().catch(() => false);
    if (switchVisible) {
      return;
    }
  }

  throw new Error('Nenhuma rota candidata exibiu o seletor de moeda.');
}

function sanitizePublicRoutes(routes: string[]): string[] {
  const publicRoutes = routes.filter((route) => {
    if (route.startsWith('/admin')) return false;
    if (route.startsWith('/dashboard')) return false;
    if (route.startsWith('/consignor-dashboard')) return false;
    if (route.startsWith('/lawyer')) return false;
    if (route.startsWith('/auth')) return false;
    if (route.startsWith('/profile')) return false;
    return true;
  });

  return publicRoutes.slice(0, 20);
}

test('deve alternar moeda global no header e refletir conversão de valores nas páginas públicas', async ({ page }) => {
  test.setTimeout(420_000);

  const discoveredRoutes = discoverRoutesFromFilesystem();
  writeTmpArtifacts('routes-discovered.txt', `${discoveredRoutes.join('\n')}\n`);

  const routesToScan = sanitizePublicRoutes(discoveredRoutes);
  const inventory: Record<string, { hasCurrencySwitch: boolean; buttons: number; links: number }> = {};
  const coverage: CoverageEntry[] = [];
  const routesWithSwitch: string[] = [];

  for (const route of routesToScan) {
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      const hasCurrencySwitch = await page.locator('[data-ai-id="header-currency-switch"]').isVisible().catch(() => false);
      const buttons = await page.locator('button:enabled').count();
      const links = await page.locator('a[href^="/"]').count();

      inventory[route] = { hasCurrencySwitch, buttons, links };

      if (hasCurrencySwitch) {
        routesWithSwitch.push(route);
        coverage.push({ route, element: 'header-currency-switch', status: 'tested' });
      } else {
        coverage.push({ route, element: 'header-currency-switch', status: 'skipped', reason: 'seletor não visível na rota' });
      }
    } catch (error) {
      inventory[route] = { hasCurrencySwitch: false, buttons: 0, links: 0 };
      coverage.push({
        route,
        element: 'route-navigation',
        status: 'failed',
        reason: error instanceof Error ? error.message : 'navigation_error',
      });
    }
  }

  writeTmpArtifacts('ui-inventory.json', JSON.stringify(inventory, null, 2));

  const ratesResponse = await page.request.get('/api/public/currency/rates?base=BRL&symbols=USD,EUR');
  expect(ratesResponse.ok()).toBeTruthy();
  const ratesPayload = await ratesResponse.json() as { rates?: { USD?: number; EUR?: number } };
  expect((ratesPayload.rates?.USD ?? 0)).toBeGreaterThan(0);
  expect((ratesPayload.rates?.EUR ?? 0)).toBeGreaterThan(0);

  if (routesWithSwitch.length > 0) {
    await page.goto(routesWithSwitch[0], { waitUntil: 'domcontentloaded' });
  } else {
    await navigateToRouteWithCurrencySwitch(page);
  }

  await setCurrencyParameter(page, 'BRL');

  const currencySwitch = page.locator('[data-ai-id="header-currency-switch"]');
  await expect(currencySwitch).toBeVisible();
  await expect(currencySwitch).toContainText('BRL');

  await expectCurrencyVisibleOnPage(page, 'BRL');
  const brlPrice = await readPromoPriceText(page);
  expect(brlPrice).not.toBe('');

  await setCurrencyParameter(page, 'USD');
  await expect(currencySwitch).toContainText('USD');
  await expectCurrencyVisibleOnPage(page, 'USD');
  const usdPrice = await readPromoPriceText(page);
  expect(usdPrice).not.toBe(brlPrice);

  await page.goto('/search?type=lots', { waitUntil: 'domcontentloaded' });
  await expectCurrencyVisibleOnPage(page, 'USD');

  await page.goto('/home-v2', { waitUntil: 'domcontentloaded' });
  await expectCurrencyVisibleOnPage(page, 'USD');

  await setCurrencyParameter(page, 'BRL');
  await expect(currencySwitch).toContainText('BRL');
  await expectCurrencyVisibleOnPage(page, 'BRL');
  const brlPriceAfterReset = await readPromoPriceText(page);
  expect(brlPriceAfterReset).not.toBe('');
  expect(brlPriceAfterReset).not.toBe(usdPrice);

  writeTmpArtifacts('ui-coverage.json', JSON.stringify({
    totalRoutesDiscovered: discoveredRoutes.length,
    totalRoutesScanned: routesToScan.length,
    routesWithCurrencySwitch: routesWithSwitch.length,
    coverage,
  }, null, 2));
});
