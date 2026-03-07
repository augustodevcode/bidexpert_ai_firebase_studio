import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/helpers';

test.describe('Admin - Lot Category Management', () => {

  // Before each test in this suite, log in as an admin
  test.beforeEach(async ({ page }) => {
    // Due to the environment issue, loginAsAdmin will likely fail.
    // This test is written assuming loginAsAdmin works.
    // A real run would require a valid admin user and a working login flow.
    // You might need to manually log in and save the session state for Playwright to use.
    // For now, we call it to show the intended structure.
    await loginAsAdmin(page);
    await page.goto('/admin/categories');
    await expect(page.getByRole('heading', { name: 'Gerenciar Categorias' })).toBeVisible();
  });

  test('should allow an admin to create, update, and delete a lot category', async ({ page }) => {
    const categoryName = `Test Category ${Date.now()}`;
    const updatedCategoryName = `${categoryName} - Updated`;

    // --- 1. CREATE ---
    await page.getByRole('button', { name: 'Nova Categoria' }).click();

    // Wait for the form/dialog to appear
    await expect(page.getByRole('heading', { name: 'Nova Categoria' })).toBeVisible();

    // Fill the form
    await page.getByLabel('Nome da Categoria').fill(categoryName);
    await page.getByLabel('Descrição').fill('This is a test category created by an automated test.');

    // Save
    await page.getByRole('button', { name: 'Salvar' }).click();

    // --- 2. VERIFY CREATION ---
    // Check for success toast
    await expect(page.locator('text=Categoria criada com sucesso')).toBeVisible();

    // Find the new category in the table
    const categoryRow = page.getByRole('row', { name: new RegExp(categoryName) });
    await expect(categoryRow).toBeVisible();

    // --- 3. UPDATE ---
    // Click the 'Edit' button within the new category's row
    await categoryRow.getByRole('button', { name: 'Ações' }).click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();

    // Wait for the edit form/dialog
    await expect(page.getByRole('heading', { name: 'Editar Categoria' })).toBeVisible();

    // Update the name
    const nameInput = page.getByLabel('Nome da Categoria');
    await nameInput.clear();
    await nameInput.fill(updatedCategoryName);

    // Save changes
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();

    // --- 4. VERIFY UPDATE ---
    await expect(page.locator('text=Categoria atualizada com sucesso')).toBeVisible();

    // The old name should not be visible, the new one should
    await expect(page.getByRole('row', { name: new RegExp(categoryName) })).not.toBeVisible();
    const updatedCategoryRow = page.getByRole('row', { name: new RegExp(updatedCategoryName) });
    await expect(updatedCategoryRow).toBeVisible();

    // --- 5. DELETE ---
    // Click the 'Delete' button for the updated category
    await updatedCategoryRow.getByRole('button', { name: 'Ações' }).click();
    await page.getByRole('menuitem', { name: 'Excluir' }).click();

    // Confirm the deletion in the alert dialog
    await expect(page.getByRole('heading', { name: 'Confirmar Exclusão' })).toBeVisible();
    await page.getByRole('button', { name: 'Excluir' }).click();

    // --- 6. VERIFY DELETION ---
    await expect(page.locator('text=Categoria excluída com sucesso')).toBeVisible();

    // The updated category row should no longer be in the table
    await expect(page.getByRole('row', { name: new RegExp(updatedCategoryName) })).not.toBeVisible();
  });
});
