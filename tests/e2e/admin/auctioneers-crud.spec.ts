import { test, expect } from '@playwright/test';
import { BASE_URL, ensureAdminSession } from './admin-helpers';
import { faker as fakerPtBr } from '@faker-js/faker/locale/pt_BR';

test.describe('Admin CRUD - Auctioneers (Leiloeiros)', () => {
  test('Create and list auctioneer', async ({ page }) => {
    await ensureAdminSession(page);
    await page.goto(`${BASE_URL}/admin/auctioneers`, { waitUntil: 'domcontentloaded' });

    // Navigate to create form if available
    const create = page.getByRole('link', { name: /novo|criar|adicionar leiloeiro/i }).first();
    if (await create.isVisible().catch(() => false)) {
      await create.click();
    } else {
      await page.goto(`${BASE_URL}/admin/auctioneers/new`, { waitUntil: 'domcontentloaded' }).catch(() => {});
    }

    const name = `${fakerPtBr.person.firstName()} ${fakerPtBr.person.lastName()} - Test`;
    const email = fakerPtBr.internet.email().toLowerCase();
    const doc = fakerPtBr.string.numeric(11);

    const nameField = page.getByLabel(/nome/i).first();
    if (await nameField.isVisible().catch(() => false)) await nameField.fill(name);
    const emailField = page.getByLabel(/email/i).first();
    if (await emailField.isVisible().catch(() => false)) await emailField.fill(email);
    const docField = page.getByLabel(/cpf|documento|registro/i).first();
    if (await docField.isVisible().catch(() => false)) await docField.fill(doc);

    const save = page.getByRole('button', { name: /salvar|criar/i }).first();
    if (await save.isVisible().catch(() => false)) {
      await Promise.all([page.waitForLoadState('networkidle'), save.click()]);
    }

    // Validate presence in list
    await page.goto(`${BASE_URL}/admin/auctioneers`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(name).first()).toBeVisible();
  });
});
