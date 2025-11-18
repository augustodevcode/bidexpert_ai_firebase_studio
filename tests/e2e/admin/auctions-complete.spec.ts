import { test, expect } from '@playwright/test';
import { BASE_URL, waitForPageLoad, selectEntityByLabel, selectShadcnByLabel, expandAccordion, saveForm, assertToastOrSuccess, genAuctionData } from './admin-helpers';

test.describe('Admin CRUD - Auctions Comprehensive', () => {
  test('Validate complete auction workflow with all fields', async ({ page }) => {
    // Navigate to auctions list
    await page.goto(`${BASE_URL}/admin/auctions`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);

    // Click new auction button
    const newButton = page.getByRole('button', { name: /novo leilão|novo|new/i }).first();
    await newButton.click();
    await waitForPageLoad(page);

    const data = genAuctionData();

    // Informações Gerais
    await expandAccordion(page, /informa[cç][oõ]es gerais/i);
    await page.getByLabel(/título do leilão|t[ií]tulo/i).first().fill(data.title);
    
    const descField = page.getByLabel(/descri[cç][aã]o/i).first();
    if (await descField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descField.fill(data.description);
    }

    // Select category, auctioneer, seller from seeded data
    await selectEntityByLabel(page, /Categoria Principal/);
    
    // Participantes
    await expandAccordion(page, /participantes/i);
    await selectEntityByLabel(page, /Leiloeiro/);
    await selectEntityByLabel(page, /Comitente/);

    // Modalidade e Método
    await expandAccordion(page, /modalidade/i);
    await selectShadcnByLabel(page, /Modalidade\s*\*/i, /PARTICULAR|EXTRAJUDICIAL/i);
    await selectShadcnByLabel(page, /Participa[cç][aã]o\s*\*/i, /ONLINE|HIBRIDO/i);
    await selectShadcnByLabel(page, /M[ée]todo\s*\*/i, /STANDARD/i);

    // Set status
    await expandAccordion(page, /informa[cç][oõ]es gerais/i);
    await selectShadcnByLabel(page, /Status\s*\*/i, /EM_BREVE|ABERTO/i);

    // Save
    await saveForm(page);
    await assertToastOrSuccess(page);

    // Verify on list
    await page.goto(`${BASE_URL}/admin/auctions`, { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await expect(page.getByText(data.title, { exact: false })).toBeVisible({ timeout: 10000 });

    console.log(`✅ Auction created successfully: ${data.title}`);
  });

  test('Verify auction modality options and identify gaps', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/auctions/new`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);

    // Expand modality section
    await expandAccordion(page, /modalidade/i);

    // Open method select and verify options
    const methodLabel = page.locator('label', { hasText: /M[ée]todo/ }).first();
    await methodLabel.waitFor({ state: 'visible', timeout: 10000 });
    const combobox = methodLabel.locator('xpath=following::button[@role="combobox"][1]').first();
    await combobox.click();
    await page.waitForTimeout(500);

    // Check for supported methods
    const hasStandard = await page.getByRole('option', { name: /standard/i }).first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasDutch = await page.getByRole('option', { name: /dutch/i }).first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasSilent = await page.getByRole('option', { name: /silent/i }).first().isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasStandard).toBeTruthy();
    expect(hasDutch).toBeTruthy();
    expect(hasSilent).toBeTruthy();

    // Gap: Reverse auctions
    const hasReverse = await page.getByRole('option', { name: /reverse|reverso/i }).first().isVisible({ timeout: 5000 }).catch(() => false);
    expect.soft(hasReverse).toBeFalsy();
    console.log('⚠️  GAP: Reverse auctions not supported in UI');

    // Check for UI toggles (gaps)
    await page.keyboard.press('Escape');
    const silentToggle = await page.getByLabel(/lances silenciosos|silent bidding/i).first().isVisible({ timeout: 2000 }).catch(() => false);
    const softCloseToggle = await page.getByLabel(/soft close/i).first().isVisible({ timeout: 2000 }).catch(() => false);
    const autoRelistToggle = await page.getByLabel(/relista.*autom|auto.*relist/i).first().isVisible({ timeout: 2000 }).catch(() => false);

    expect.soft(silentToggle).toBeFalsy();
    expect.soft(softCloseToggle).toBeFalsy();
    expect.soft(autoRelistToggle).toBeFalsy();

    console.log('⚠️  GAPS: Silent bidding toggle, soft-close toggle, and auto-relist settings not exposed in UI');
  });
});
