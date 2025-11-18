import { test, expect } from '@playwright/test';
import { BASE_URL, ensureAdminSession, genSellerData, saveForm, assertToastOrSuccess } from './admin-helpers';

test.describe('Admin CRUD - Sellers (Comitentes)', () => {
  test('Create and list seller', async ({ page }) => {
    await ensureAdminSession(page);
    await page.goto(`${BASE_URL}/admin/sellers`, { waitUntil: 'domcontentloaded' });

    // Navigate to new
    const newBtn = page.getByRole('link', { name: /novo|novo comitente|criar/i }).first();
    if (await newBtn.isVisible().catch(() => false)) {
      await newBtn.click();
    } else {
      await page.goto(`${BASE_URL}/admin/sellers/new`, { waitUntil: 'domcontentloaded' });
    }

    const data = genSellerData();
    await page.getByLabel(/nome/i).fill(data.name);
    const email = page.getByLabel(/email/i).first();
    if (await email.isVisible().catch(() => false)) await email.fill(data.email);
    const phone = page.getByLabel(/telefone|whatsapp/i).first();
    if (await phone.isVisible().catch(() => false)) await phone.fill(data.phone);

    await saveForm(page);
    await assertToastOrSuccess(page);

    await page.goto(`${BASE_URL}/admin/sellers`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(data.name)).toBeVisible();
  });
});
