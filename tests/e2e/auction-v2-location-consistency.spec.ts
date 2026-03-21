/**
 * @fileoverview Garante consistência entre estado e cidade no formulário de leilão V2.
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import { BASE_URL, ensureAdminSession } from './admin/admin-helpers';

function getComboboxByLabel(page: Page, label: string): Locator {
  return page.locator('label', { hasText: label }).locator('xpath=following::button[@role="combobox"][1]').first();
}

async function selectStateWithAvailableCity(page: Page, stateCombobox: Locator, cityCombobox: Locator) {
  await stateCombobox.click();
  const stateLabels = (await page.getByRole('option').allTextContents())
    .map((value) => value.trim())
    .filter(Boolean);
  await page.keyboard.press('Escape');

  for (const stateLabel of stateLabels) {
    await stateCombobox.click();
    await page.getByRole('option', { name: stateLabel, exact: true }).click();

    await cityCombobox.click();
    const cityLabels = (await page.getByRole('option').allTextContents())
      .map((value) => value.trim())
      .filter(Boolean);

    if (cityLabels.length > 0) {
      await page.getByRole('option', { name: cityLabels[0], exact: true }).click();
      return { stateLabel, cityLabel: cityLabels[0], allStateLabels: stateLabels };
    }

    await page.keyboard.press('Escape');
  }

  throw new Error('Nenhum estado com cidade disponível foi encontrado para o cenário E2E.');
}

test.describe('Auction V2 - location consistency', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await ensureAdminSession(page);
  });

  test('changing state clears an orphaned city selection', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/auctions-v2/new`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    await expect(page.getByRole('heading', { name: /Novo Leilão/i })).toBeVisible({ timeout: 60_000 });

    const stateCombobox = getComboboxByLabel(page, 'Estado');
    const cityCombobox = getComboboxByLabel(page, 'Cidade');

    const { stateLabel: firstStateLabel, cityLabel: firstCityLabel, allStateLabels } = await selectStateWithAvailableCity(
      page,
      stateCombobox,
      cityCombobox
    );
    const secondStateLabel = allStateLabels.find((label) => label !== firstStateLabel);

    expect(firstStateLabel).toBeTruthy();
    expect(secondStateLabel).toBeTruthy();
    expect(secondStateLabel).not.toBe(firstStateLabel);

    expect(firstCityLabel).toBeTruthy();
    await expect(cityCombobox).toContainText(firstCityLabel!);

    await stateCombobox.click();
    await page.getByRole('option', { name: secondStateLabel!, exact: true }).click();

    await expect(cityCombobox).toContainText('Selecione');
    await expect(cityCombobox).not.toContainText(firstCityLabel!);
  });
});