import { test, expect } from '@playwright/test';
import { BASE_URL, ensureAdminSession, genLotData, saveForm, assertToastOrSuccess, randomImageUrl } from './admin-helpers';

test.describe('Admin CRUD - Lots', () => {
  test('Create lot linked to an auction with pricing and gallery', async ({ page }) => {
    await ensureAdminSession(page);
    await page.goto(`${BASE_URL}/admin/lots/new`, { waitUntil: 'domcontentloaded' });

    const data = genLotData();

    await page.getByLabel(/título|titulo/i).fill(data.title);
    const number = page.getByLabel(/n(ú|u)mero.*lote|c[oó]d\.?/i).first();
    if (await number.isVisible().catch(() => false)) await number.fill(data.number);

    // Required: auction association
    const auctionSel = page.getByLabel(/leil(ã|a)o|auction/i).first();
    if (await auctionSel.isVisible().catch(() => false)) {
      await auctionSel.selectOption({ index: 1 }).catch(() => {});
    }

    // Pricing
    const price = page.getByLabel(/preço|valor|price/i).first();
    if (await price.isVisible().catch(() => false)) await price.fill(String(data.price));
    const inc = page.getByLabel(/incremento|passo/i).first();
    if (await inc.isVisible().catch(() => false)) await inc.fill(String(data.bidIncrement));

    // Location
    const addr = page.getByLabel(/endereço|map/i).first();
    if (await addr.isVisible().catch(() => false)) await addr.fill(data.address);
    const city = page.getByLabel(/cidade/i).first();
    if (await city.isVisible().catch(() => false)) await city.fill(data.city);
    const state = page.getByLabel(/estado|uf/i).first();
    if (await state.isVisible().catch(() => false)) await state.fill(data.state);

    // Gallery URLs if supported
    const galleryAdder = page.getByRole('button', { name: /adicionar imagem|add image|galeria/i }).first();
    if (await galleryAdder.isVisible().catch(() => false)) {
      await galleryAdder.click();
      const urlField = page.getByLabel(/url.*(galeria|imagem)/i).first();
      if (await urlField.isVisible().catch(() => false)) {
        await urlField.fill(randomImageUrl());
      }
    }

    await saveForm(page);
    await assertToastOrSuccess(page);

    await page.goto(`${BASE_URL}/admin/lots`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(data.title).first()).toBeVisible();
  });
});
