import { test, expect } from '@playwright/test';
import { BASE_URL, ensureAdminSession, genAuctionData, saveForm, assertToastOrSuccess, selectShadcnByLabel, selectEntityByLabel } from './admin-helpers';

test.describe('Admin CRUD - Auctions', () => {
  test('Create, view and validate auction fields incl. modalities', async ({ page }) => {
    await ensureAdminSession(page);

    // Pre-create minimal dependencies via UI: Category, Auctioneer, Seller
    // Category
    await page.goto(`${BASE_URL}/admin/categories/new`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: /nova categoria/i }).waitFor({ state: 'visible', timeout: 10000 });
    const catName = `Categoria Auto ${Date.now()}`;
    await page.getByLabel(/Nome da Categoria/i).fill(catName);
    await saveForm(page);
    await assertToastOrSuccess(page);

    // Auctioneer
    await page.goto(`${BASE_URL}/admin/auctioneers`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /novo leiloeiro/i }).click();
    await page.locator('[data-ai-id="auctioneer-form"]').waitFor({ state: 'visible', timeout: 10000 });
    await page.getByLabel(/nome do leiloeiro|nome/i).first().fill(`Leiloeiro Auto ${Date.now()}`);
    await saveForm(page);
    await assertToastOrSuccess(page);

    // Seller
    await page.goto(`${BASE_URL}/admin/sellers`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /novo comitente/i }).click();
    await page.locator('[data-ai-id="seller-form"]').waitFor({ state: 'visible', timeout: 10000 });
    await page.getByLabel(/nome do comitente|nome/i).first().fill(`Comitente Auto ${Date.now()}`);
    await saveForm(page);
    await assertToastOrSuccess(page);

    // Navigate to new auction page
    await page.goto(`${BASE_URL}/admin/auctions/new`, { waitUntil: 'domcontentloaded' });

    const data = genAuctionData();

    // Fill basic fields
    await page.getByLabel(/título do leilão|t[ií]tulo/i).first().fill(data.title);
    const descriptionControl = page.getByLabel(/descri[cç][aã]o/i).first();
    if (await descriptionControl.isVisible().catch(() => false)) {
      await descriptionControl.fill(data.description);
    }

  // Select required relations via EntitySelector by FormLabel
  await selectEntityByLabel(page, /Categoria Principal/);
  await selectEntityByLabel(page, /Leiloeiro/);
  await selectEntityByLabel(page, /Comitente\/Vendedor/);

    // Expand "Modalidade, Método e Local"
    const trigger = page.getByRole('button', { name: /modalidade, m[ée]todo e local/i }).first();
    if (await trigger.isVisible().catch(() => false)) {
      await trigger.click();
    }

    // Select auction type (Modalidade) and participation (to trigger validation updates)
    await selectShadcnByLabel(page, /Modalidade\s*\*/, /PARTICULAR|EXTRAJUDICIAL|JUDICIAL/);
    await selectShadcnByLabel(page, /Participa[cç][aã]o\s*\*/, /ONLINE|HIBRIDO|PRESENCIAL/);
    // Select auction method (Método)
    await selectShadcnByLabel(page, /M[ée]todo\s*\*/, /STANDARD/);

    // Optionally set Status to be safe
    const geralTrigger = page.getByRole('button', { name: /informa[cç][oõ]es gerais/i }).first();
    if (await geralTrigger.isVisible().catch(() => false)) {
      await geralTrigger.click();
    }
    try {
      await selectShadcnByLabel(page, /Status\s*\*/, /EM_BREVE|ABERTO|RASCUNHO/);
    } catch {}

    // Save
  // Ensure save button becomes enabled before clicking
  const saveBtn = page.getByRole('button', { name: /salvar|criar/i }).first();
  await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
  await saveForm(page);
    await assertToastOrSuccess(page);

    // Validate on list page
    await page.goto(`${BASE_URL}/admin/auctions`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(data.title)).toBeVisible();

    // Quick modality options check
    await page.goto(`${BASE_URL}/admin/auctions/new`, { waitUntil: 'domcontentloaded' });
    const trigger2 = page.getByRole('button', { name: /modalidade, m[ée]todo e local/i }).first();
    if (await trigger2.isVisible().catch(() => false)) {
      await trigger2.click();
    }
    await selectShadcnByLabel(page, /M[ée]todo\s*\*/, /STANDARD/);
    // Open again to view options
    const methodLabel = page.locator('label', { hasText: /M[ée]todo/ }).first();
    await methodLabel.locator('xpath=following::button[@role="combobox"][1]').click();
    const hasDutch = await page.getByRole('option', { name: /dutch/i }).first().isVisible().catch(() => false);
    expect(hasDutch).toBeTruthy();
    const hasReverse = await page.getByRole('option', { name: /reverse|reverso/i }).first().isVisible().catch(() => false);
    expect.soft(hasReverse).toBeFalsy(); // GAP: Reverse auctions not supported
  });
});
