/**
 * @fileoverview Valida o seletor global de moeda no cabeçalho público.
 */

import { expect, test } from '@playwright/test';

async function selectCurrency(page: import('@playwright/test').Page, code: 'BRL' | 'USD' | 'EUR') {
  await page.locator('[data-ai-id="header-currency-switch"]').click();
  await page.locator(`[data-ai-id="header-currency-option-${code.toLowerCase()}"]`).click();
  await expect(page.locator('[data-ai-id="header-currency-current"]')).toContainText(code);
  await expect
    .poll(async () => page.evaluate(() => window.localStorage.getItem('bidexpert:selected-currency')))
    .toBe(code);
}

async function expectCurrencyVisibleOnPage(page: import('@playwright/test').Page, code: 'BRL' | 'USD' | 'EUR') {
  const promoText = await page.locator('[data-ai-id="header-promo-text"]').innerText();
  if (code === 'BRL') {
    expect(promoText).toMatch(/R\$/);
    return;
  }

  if (code === 'USD') {
    expect(promoText).toMatch(/\$/);
    return;
  }

  expect(promoText).toMatch(/€/);
}

test('deve alternar moeda global no header e refletir nos valores das páginas públicas', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const currencySwitch = page.locator('[data-ai-id="header-currency-switch"]');
  await expect(currencySwitch).toBeVisible();
  await expect(currencySwitch).toContainText('🇧🇷');
  await expect(currencySwitch).toContainText('BRL');

  await expectCurrencyVisibleOnPage(page, 'BRL');

  await selectCurrency(page, 'USD');
  await expect(currencySwitch).toContainText('🇺🇸');
  await expectCurrencyVisibleOnPage(page, 'USD');

  await page.goto('/search?type=lots', { waitUntil: 'domcontentloaded' });
  await expectCurrencyVisibleOnPage(page, 'USD');

  await page.goto('/home-v2', { waitUntil: 'domcontentloaded' });
  await expectCurrencyVisibleOnPage(page, 'USD');

  await selectCurrency(page, 'EUR');
  await expect(currencySwitch).toContainText('🇪🇺');
  await expectCurrencyVisibleOnPage(page, 'EUR');

  await page.goto('/search?type=lots', { waitUntil: 'domcontentloaded' });
  await expectCurrencyVisibleOnPage(page, 'EUR');

  await selectCurrency(page, 'BRL');
  await expect(currencySwitch).toContainText('🇧🇷');
  await expectCurrencyVisibleOnPage(page, 'BRL');
});
