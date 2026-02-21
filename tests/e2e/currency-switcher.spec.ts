/**
 * @fileoverview Valida o seletor global de moeda no cabeçalho público.
 */

import { expect, test } from '@playwright/test';

test('deve alternar moeda no seletor global do header', async ({ page }) => {
  await page.goto('http://demo.localhost:9005');

  const currencySwitch = page.locator('[data-ai-id="header-currency-switch"]');
  await expect(currencySwitch).toBeVisible();
  await expect(currencySwitch).toContainText('🇧🇷');

  await page.evaluate(() => window.localStorage.setItem('bidexpert:selected-currency', 'USD'));
  await page.reload();
  await expect(currencySwitch).toContainText('🇺🇸');

  await expect.poll(async () => {
    return page.evaluate(() => window.localStorage.getItem('bidexpert:selected-currency'));
  }).toBe('USD');

  await page.evaluate(() => window.localStorage.setItem('bidexpert:selected-currency', 'EUR'));
  await page.reload();
  await expect(currencySwitch).toContainText('🇪🇺');

  await expect.poll(async () => {
    return page.evaluate(() => window.localStorage.getItem('bidexpert:selected-currency'));
  }).toBe('EUR');
});
