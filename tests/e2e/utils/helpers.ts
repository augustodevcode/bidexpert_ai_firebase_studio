import { Page, expect } from '@playwright/test';

// TODO: Use environment variables for credentials
const DEFAULT_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
const DEFAULT_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'password123';

export async function loginAsAdmin(page: Page) {
  await page.goto('/auth/login');

  // Wait for the login form elements to be visible to ensure the page is loaded
  await expect(page.getByLabel('Email')).toBeVisible({ timeout: 10000 }); // Increased timeout
  await expect(page.getByLabel('Senha')).toBeVisible();

  await page.getByLabel('Email').fill(DEFAULT_ADMIN_EMAIL);
  await page.getByLabel('Senha').fill(DEFAULT_ADMIN_PASSWORD);

  // Wait for the login button to be enabled (or just visible if it's always enabled)
  const loginButton = page.getByRole('button', { name: 'Login' });
  await expect(loginButton).toBeVisible();
  await expect(loginButton).toBeEnabled(); // Ensure it's clickable

  await loginButton.click();

  // Wait for successful login navigation or a clear indicator of success
  // For example, wait for the URL to change to the dashboard or for a specific dashboard element
  await expect(page).toHaveURL(/.*\/dashboard\/overview/, { timeout: 15000 }); // Increased timeout
  await expect(page.getByRole('heading', { name: 'Visão Geral' })).toBeVisible({timeout: 10000});
}

export async function loginWithCredentials(page: Page, email?: string, password?: string) {
  const userEmail = email || DEFAULT_ADMIN_EMAIL;
  const userPassword = password || DEFAULT_ADMIN_PASSWORD;

  await page.goto('/auth/login');
  await expect(page.getByLabel('Email')).toBeVisible({ timeout: 10000 });
  await page.getByLabel('Email').fill(userEmail);
  await page.getByLabel('Senha').fill(userPassword);

  const loginButton = page.getByRole('button', { name: 'Login' });
  await expect(loginButton).toBeVisible();
  await expect(loginButton).toBeEnabled();
  await loginButton.click();
}

export async function logout(page: Page) {
  // This depends on how logout is implemented. Assume a user menu and logout button.
  // Adjust selectors as per your application's structure.
  const userNavButton = page.getByTestId('user-nav-button'); // Assuming a data-testid for the user menu trigger
  if (await userNavButton.isVisible()) {
      await userNavButton.click();
      const logoutButton = page.getByRole('menuitem', { name: /Sair|Logout/i });
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
      } else {
        // Fallback or alternative logout mechanism if the primary one isn't found
        // For example, directly navigating to a logout path if one exists
        // await page.goto('/auth/logout');
        console.warn('Primary logout button not found after clicking user nav. Attempting alternative.');
        // Add alternative logout steps if necessary
      }
  } else {
     // If userNavButton is not visible, maybe try another way or log a warning.
     // This could be a direct navigation if available, or a different menu structure.
     // For now, let's assume direct navigation if the button isn't there.
     console.warn('User nav button not visible. Attempting direct logout navigation or alternative.');
     // Example: await page.goto('/api/auth/logout'); // If such an endpoint exists
     // Or find another element that triggers logout.
     const logoutLink = page.getByRole('link', { name: /Sair|Logout/i });
     if(await logoutLink.isVisible()){
        await logoutLink.click();
     } else {
        throw new Error("Logout mechanism not found. User nav button and direct logout link are missing.");
     }
  }

  await expect(page).toHaveURL(/.*\/auth\/login/); // Expect to be redirected to login page
  await expect(page.getByRole('heading', { name: 'Bem-vindo de Volta!' })).toBeVisible();
}
