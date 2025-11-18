import { test, expect } from '@playwright/test';
import { BASE_URL, waitForPageLoad, selectShadcnByLabel, saveForm, assertToastOrSuccess, genAssetData } from './admin-helpers';

test.describe('Admin CRUD - Assets Comprehensive', () => {
  test('Create asset with evaluation and location data', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/assets`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);

    const newButton = page.getByRole('button', { name: /novo ativo|novo|new/i }).first();
    await newButton.click();
    await waitForPageLoad(page);

    const data = genAssetData();

    // Fill basic information
    await page.getByLabel(/título|title|nome/i).first().fill(data.title);

    // Fill evaluation value
    const evalInput = page.getByLabel(/valor.*avalia[cç][aã]o|evaluation|valor/i).first();
    if (await evalInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await evalInput.fill(data.evaluationValue.toString());
    }

    // Fill location
    const addressInput = page.getByLabel(/endere[cç]o|address|rua/i).first();
    if (await addressInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addressInput.fill(data.address);
    }

    // Status
    await selectShadcnByLabel(page, /Status/i, /DISPONIVEL|ATIVO/i);

    // Save
    await saveForm(page);
    await assertToastOrSuccess(page);

    // Verify on list
    await page.goto(`${BASE_URL}/admin/assets`, { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await expect(page.getByText(data.title, { exact: false })).toBeVisible({ timeout: 10000 });

    console.log(`✅ Asset created successfully: ${data.title}`);
  });
});
