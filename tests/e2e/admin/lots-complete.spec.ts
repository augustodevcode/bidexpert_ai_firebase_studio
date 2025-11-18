import { test, expect } from '@playwright/test';
import { BASE_URL, waitForPageLoad, selectEntityByLabel, selectShadcnByLabel, saveForm, assertToastOrSuccess, genLotData } from './admin-helpers';

test.describe('Admin CRUD - Lots Comprehensive', () => {
  test('Create and validate lot with all required fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/lots`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);

    const newButton = page.getByRole('button', { name: /novo lote|novo|new/i }).first();
    await newButton.click();
    await waitForPageLoad(page);

    const data = genLotData();

    // Fill basic lot information
    await page.getByLabel(/título|title/i).first().fill(data.title);
    await page.getByLabel(/número do lote|lote|number/i).first().fill(data.number);

    // Select auction from seeded data
    await selectEntityByLabel(page, /Leilão|Auction/i);

    // Fill pricing
    const priceInput = page.getByLabel(/preço inicial|pre[cç]o|price/i).first();
    if (await priceInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await priceInput.fill(data.price.toString());
    }

    const incrementInput = page.getByLabel(/incremento|increment/i).first();
    if (await incrementInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await incrementInput.fill(data.bidIncrement.toString());
    }

    // Select status
    await selectShadcnByLabel(page, /Status/i, /DISPONIVEL|ABERTO/i);

    // Save
    await saveForm(page);
    await assertToastOrSuccess(page);

    // Verify on list
    await page.goto(`${BASE_URL}/admin/lots`, { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await expect(page.getByText(data.title, { exact: false })).toBeVisible({ timeout: 10000 });

    console.log(`✅ Lot created successfully: ${data.title}`);
  });
});
