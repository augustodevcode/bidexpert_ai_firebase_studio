import { test, expect } from '@playwright/test';
import { BASE_URL, ensureAdminSession, genCategoryData, saveForm, assertToastOrSuccess } from './admin-helpers';

test.describe('Admin CRUD - Categories', () => {
  test('Create and list category and subcategory', async ({ page }) => {
    await ensureAdminSession(page);
    await page.goto(`${BASE_URL}/admin/categories/new`, { waitUntil: 'domcontentloaded' });

    const cat = genCategoryData();
    await page.getByLabel(/nome/i).fill(cat.name);
    const desc = page.getByLabel(/descrição/i).first();
    if (await desc.isVisible().catch(() => false)) await desc.fill(cat.description);

    await saveForm(page);
    await assertToastOrSuccess(page);

    await page.goto(`${BASE_URL}/admin/categories`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(cat.name)).toBeVisible();

    // Subcategory creation if UI supports
    const subBtn = page.getByRole('button', { name: /nova subcategoria|adicionar subcategoria/i }).first();
    if (await subBtn.isVisible().catch(() => false)) {
      await subBtn.click();
      const subName = `${cat.name} - Sub ${Date.now().toString().slice(-4)}`;
      const subInput = page.getByLabel(/nome.*subcategoria/i).first();
      if (await subInput.isVisible().catch(() => false)) {
        await subInput.fill(subName);
        await saveForm(page);
        await assertToastOrSuccess(page);
        await expect(page.getByText(subName)).toBeVisible();
      }
    }
  });
});
