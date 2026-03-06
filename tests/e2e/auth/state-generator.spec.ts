import { test, expect } from '@playwright/test';

// IMPORTANT: Use the real credentials provided by the user.
const adminEmail = 'admin@bidexpert.com.br';
const adminPassword = 'Admin@123';

test('generate storage state for admin user', async ({ page }) => {
  // Navigate to the login page using the full public URL
  await page.goto('/auth/login');

  // Wait for the form to be ready
  await expect(page.getByLabel('Email')).toBeVisible({ timeout: 20000 });

  // Fill in credentials
  await page.getByLabel('Email').fill(adminEmail);
  await page.getByLabel('Senha').fill(adminPassword);

  // Click login
  await page.getByRole('button', { name: 'Login' }).click();

  // Wait for successful login by checking for a unique element on the admin dashboard
  // and for the URL to change.
  await expect(page).toHaveURL(/.*\/admin/, { timeout: 20000 });
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // Save the authentication state to a file.
  // This file can now be used by other tests to log in instantly.
  await page.context().storageState({ path: 'storageState.json' });

  console.log('storageState.json has been generated successfully.');
});
