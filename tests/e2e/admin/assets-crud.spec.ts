import { test, expect } from '@playwright/test';
import { BASE_URL, ensureAdminSession, genAssetData, saveForm, assertToastOrSuccess } from './admin-helpers';

test.describe('Admin CRUD - Assets', () => {
  test('Create and view asset with evaluation and location', async ({ page }) => {
    await ensureAdminSession(page);
    await page.goto(`${BASE_URL}/admin/assets/new`, { waitUntil: 'domcontentloaded' });

    const data = genAssetData();

    // Title
    const titleField = page.getByLabel(/título|titulo|nome/i).first();
    if (await titleField.isVisible().catch(() => false)) {
      await titleField.fill(data.title);
    }

    // Evaluation value
    const evalField = page.getByLabel(/avaliação|evaluation/i).first();
    if (await evalField.isVisible().catch(() => false)) {
      await evalField.fill(String(data.evaluationValue));
    }

    // Address fields
    const addr = page.getByLabel(/endereço|logradouro|map/i).first();
    if (await addr.isVisible().catch(() => false)) await addr.fill(data.address);
    const city = page.getByLabel(/cidade/i).first();
    if (await city.isVisible().catch(() => false)) await city.fill(data.city);
    const state = page.getByLabel(/estado|uf/i).first();
    if (await state.isVisible().catch(() => false)) await state.fill(data.state);

    // Image
    const img = page.getByLabel(/imagem|image url|foto/i).first();
    if (await img.isVisible().catch(() => false)) await img.fill(data.imageUrl);

    await saveForm(page);
    await assertToastOrSuccess(page);

    await page.goto(`${BASE_URL}/admin/assets`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(data.title).first()).toBeVisible();
  });
});
