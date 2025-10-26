// tests/ui/setup-and-subscription.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Setup and Subscription Flow', () => {
  test('should complete full setup flow when isSetupComplete is false', async ({ page }) => {
    // Start from homepage - should redirect to setup if not complete
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'false');
      window.localStorage.removeItem('bidexpert-subscription-popup-seen');
    });

    await page.goto('/', { timeout: 300000 });

    // Should redirect to setup page
    await expect(page).toHaveURL(/\/setup/, { timeout: 30000 });

    // Should show setup page
    await expect(page.locator('[data-ai-id="setup-main-card"]')).toBeVisible({ timeout: 60000 });

    // Step 1: Welcome Step - use force click to handle any overlays
    await page.click('[data-ai-id="setup-welcome-next-button"]', { force: true });

    // Step 2: Seeding Step
    await expect(page.locator('[data-ai-id="setup-seeding-populate-button"]')).toBeVisible({ timeout: 60000 });

    // Click populate button
    await page.click('[data-ai-id="setup-seeding-populate-button"]', { force: true });

    // Wait for seeding to complete (check for loading state)
    await expect(page.locator('[data-ai-id="setup-seeding-populate-button"]')).toHaveText(/Populando.../, { timeout: 30000 });

    // Wait for seeding to finish
    await expect(page.locator('[data-ai-id="setup-seeding-populate-button"]')).toHaveText(/Popular com Dados de Demonstração/, { timeout: 180000 });

    // Click verify and next
    await page.click('[data-ai-id="setup-seeding-verify-button"]', { force: true });

    // Step 3: Admin User Step
    await expect(page.locator('[data-ai-id="setup-admin-email-input"]')).toBeVisible({ timeout: 60000 });

    // Fill admin form
    await page.fill('[data-ai-id="setup-admin-fullname-input"]', 'Teste Administrador');
    await page.fill('[data-ai-id="setup-admin-email-input"]', 'admin@teste.com');
    await page.fill('[data-ai-id="setup-admin-password-input"]', 'Teste@123');

    // Submit form
    await page.click('[data-ai-id="setup-admin-create-button"]', { force: true });

    // Should show loading state
    await expect(page.locator('[data-ai-id="setup-admin-create-button"]')).toHaveText(/Criando.../, { timeout: 30000 });

    // Step 4: Finish Step
    await expect(page.locator('[data-ai-id="setup-finish-button"]')).toBeVisible({ timeout: 60000 });

    // Click finish button
    await page.click('[data-ai-id="setup-finish-button"]', { force: true });

    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin/, { timeout: 180000 });
  });

  test('should handle subscription modal when it appears', async ({ page }) => {
    // Clear localStorage to force subscription modal to appear
    await page.addInitScript(() => {
      window.localStorage.removeItem('bidexpert-subscription-popup-seen');
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    await page.goto('/', { timeout: 300000 });

    // Should not redirect to setup
    await expect(page).not.toHaveURL(/\/setup/, { timeout: 30000 });

    // Wait for subscription modal to appear (5 seconds delay)
    await expect(page.locator('[data-ai-id="subscription-modal"]')).toBeVisible({ timeout: 10000 });

    // Should show subscription form
    await expect(page.locator('[data-ai-id="subscription-email-input"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="subscription-submit-button"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="subscription-close-button"]')).toBeVisible();

    // Test closing modal without subscribing
    await page.click('[data-ai-id="subscription-close-button"]');

    // Modal should disappear
    await expect(page.locator('[data-ai-id="subscription-modal"]')).not.toBeVisible({ timeout: 5000 });

    // Should show either main content or header (more flexible check)
    await expect(page.locator('main, header, [data-ai-id="main-content"], [data-ai-id="header"]')).toBeVisible({ timeout: 60000 });
  });

  test('should handle subscription form submission', async ({ page }) => {
    // Clear localStorage to force subscription modal to appear
    await page.addInitScript(() => {
      window.localStorage.removeItem('bidexpert-subscription-popup-seen');
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    await page.goto('/', { timeout: 300000 });

    // Wait for modal
    await expect(page.locator('[data-ai-id="subscription-modal"]')).toBeVisible({ timeout: 10000 });

    // Fill subscription form
    await page.fill('[data-ai-id="subscription-name-input"]', 'Teste Usuário');
    await page.fill('[data-ai-id="subscription-email-input"]', 'teste@email.com');

    // Submit form
    await page.click('[data-ai-id="subscription-submit-button"]');

    // Should show loading state
    await expect(page.locator('[data-ai-id="subscription-submit-button"]')).toHaveText(/Inscrevendo.../, { timeout: 5000 });

    // Modal should close after successful subscription (or after error handling)
    // Wait a bit longer for the modal to close
    await expect(page.locator('[data-ai-id="subscription-modal"]')).not.toBeVisible({ timeout: 20000 });
  });

  test('should not show subscription modal if already seen', async ({ page }) => {
    // Set localStorage to indicate modal was already seen
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert-subscription-popup-seen', 'true');
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    await page.goto('/', { timeout: 300000 });

    // Should not redirect to setup
    await expect(page).not.toHaveURL(/\/setup/, { timeout: 30000 });

    // Should not show subscription modal
    await expect(page.locator('[data-ai-id="subscription-modal"]')).not.toBeVisible({ timeout: 10000 });

    // Should show either main content or header (more flexible check)
    await expect(page.locator('main, header, [data-ai-id="main-content"], [data-ai-id="header"]')).toBeVisible({ timeout: 60000 });
  });

  test('should handle setup bypass when database is already configured', async ({ page }) => {
    // Set localStorage to indicate setup is complete
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    await page.goto('/', { timeout: 300000 });

    // Should not redirect to setup
    await expect(page).not.toHaveURL(/\/setup/, { timeout: 30000 });

    // Should show main application content (flexible check)
    await expect(page.locator('main, header, [data-ai-id="main-content"], [data-ai-id="header"]')).toBeVisible({ timeout: 60000 });
  });
});
