
import { test, expect } from '@playwright/test';

test('should handle duplicate court names gracefully', async ({ page }) => {
  // Use existing auth state if available, or login
  // Assuming global setup handles login and saves state to .auth/admin.json
  // If not, we need to login. But let's try to just go to admin/courts first.
  
  await page.goto('/admin/courts');
  
  // Check if we are redirected to login
  if (page.url().includes('/auth/login')) {
      await page.fill('input[name="email"]', 'admin@bidexpert.com'); 
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      // Wait for navigation to dashboard OR admin/courts
      await page.waitForURL(/\/admin|\/dashboard/);
      await page.goto('/admin/courts');
  }

  // Create Court A
  // Wait for the button to be visible before clicking
  await page.waitForSelector('button:has-text("Novo Tribunal")', { state: 'visible', timeout: 30000 });
  await page.click('button:has-text("Novo Tribunal")');
  await page.fill('input[name="name"]', 'Tribunal Playwright A');
  await page.click('button:has-text("Salvar")');
  // Wait for success toast or modal close
  await expect(page.locator('text=Tribunal criado/atualizado com sucesso')).toBeVisible({ timeout: 10000 });
  // Close modal if it doesn't close automatically or wait for it to disappear
  // Assuming it closes or we can click outside. 
  // If the test fails here, we might need to close the toast.

  // Create Court B
  // Reload page to ensure clean state or click "Novo Tribunal" again
  await page.reload();
  await page.waitForSelector('button:has-text("Novo Tribunal")', { state: 'visible', timeout: 30000 });
  await page.click('button:has-text("Novo Tribunal")');
  await page.fill('input[name="name"]', 'Tribunal Playwright B');
  await page.click('button:has-text("Salvar")');
  await expect(page.locator('text=Tribunal criado/atualizado com sucesso')).toBeVisible({ timeout: 10000 });

  // Edit Court A to have Court B's name
  await page.reload();
  // Find the row with "Tribunal Playwright A" and click the edit button (usually a pencil icon or the row itself)
  // Adjust selector based on actual UI. Assuming text is clickable.
  await page.waitForSelector('text=Tribunal Playwright A', { state: 'visible', timeout: 30000 });
  // We need to find the edit button for this row. 
  // Assuming the row contains the text and an edit button.
  // Let's try to click the text first, if that doesn't work we need a better selector.
  // In many data tables, there is an actions column.
  // Let's try to click the "Edit" button in the row that contains "Tribunal Playwright A"
  // Or just click the text if it opens the modal.
  // Based on page.tsx: createColumns({ handleDelete, onEdit: handleEditClick })
  // The columns likely have an action menu or button.
  
  // Let's try to find the row and then the edit button.
  // Assuming standard shadcn/ui data table with actions dropdown or button.
  // If it's a button with pencil icon:
  // await page.locator('tr', { hasText: 'Tribunal Playwright A' }).locator('button').first().click();
  
  // If it's a dropdown:
  // await page.locator('tr', { hasText: 'Tribunal Playwright A' }).locator('button[aria-haspopup="menu"]').click();
  // await page.click('text=Editar');

  // Let's try a generic approach: click the row text, maybe it's not clickable but let's see.
  // If not, we will fail.
  // Let's assume there is an "Editar" button or icon.
  // Let's try to click the row actions.
  const row = page.locator('tr', { hasText: 'Tribunal Playwright A' });
  // Check if there is an edit button directly
  if (await row.locator('button:has-text("Editar")').count() > 0) {
      await row.locator('button:has-text("Editar")').click();
  } else if (await row.locator('button .lucide-pencil').count() > 0) {
      await row.locator('button .lucide-pencil').click();
  } else {
      // Try clicking the actions menu
      await row.locator('button').last().click(); // Usually actions is last column
      await page.click('text=Editar');
  }
  
  // Wait for edit modal/page
  // Clear input and type new name
  await page.fill('input[name="name"]', 'Tribunal Playwright B');
  await page.click('button:has-text("Salvar")');

  // Expect error message
  await expect(page.locator('text=Já existe um tribunal com este nome')).toBeVisible({ timeout: 10000 });

  // Cleanup (Optional, but good practice)
  // ...
});
