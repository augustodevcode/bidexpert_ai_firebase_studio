/**
 * @file Valida a responsividade do header publico em larguras intermediarias e desktop amplo.
 * @description Garante que a navegacao inferior colapse antes de quebrar o layout e que o menu mobile assuma abaixo de xl.
 */

import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

async function openPublicLotsPage(page: import('@playwright/test').Page) {
  await page.goto('/lots', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-ai-id="header-main"]')).toBeVisible({ timeout: 30_000 });
}

async function attachHeaderScreenshot(
  page: import('@playwright/test').Page,
  testInfo: import('@playwright/test').TestInfo,
  name: string,
) {
  const header = page.locator('[data-ai-id="header-main"]');
  const filePath = testInfo.outputPath(`${name}.png`);
  await header.screenshot({ path: filePath });
  await testInfo.attach(name, { path: filePath, contentType: 'image/png' });
}

test.describe('Header publico responsivo', () => {
  test('colapsa para o menu mobile antes do breakpoint xl', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await openPublicLotsPage(page);

    await expect(page.locator('[data-ai-id="header-menu-button"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="header-action-search-mobile"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="header-search-section"]')).toBeHidden();
    await expect(page.locator('[data-ai-id="header-bottom-bar"]')).toBeHidden();

    await page.locator('[data-ai-id="header-menu-button"]').click();
    await expect(page.locator('[data-ai-id="header-mobile-sheet"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="nav-mobile-link-lotes"]')).toBeVisible();

    await attachHeaderScreenshot(page, testInfo, 'header-mobile-breakpoint');
  });

  test('restaura a navegacao desktop em larguras amplas sem esconder os itens principais', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPublicLotsPage(page);

    await expect(page.locator('[data-ai-id="header-menu-button"]')).toBeHidden();
    await expect(page.locator('[data-ai-id="header-action-search-mobile"]')).toBeHidden();
    await expect(page.locator('[data-ai-id="header-search-section"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="header-bottom-bar"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="header-nav-categories"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="header-nav-items"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="nav-desktop-link-lotes"]')).toBeVisible();

    await attachHeaderScreenshot(page, testInfo, 'header-desktop-breakpoint');
  });
});