// tests/ui/basic-setup.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Basic Setup Tests', () => {
  test('should handle setup flow if not completed', async ({ page }) => {
    // Clear setup completion flag to force setup flow
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'false');
      window.localStorage.removeItem('bidexpert-subscription-popup-seen');
    });

    await page.goto('/', { timeout: 300000 });

    // Should redirect to setup if not complete
    await expect(page).toHaveURL(/\/setup/, { timeout: 30000 });

    // Should show setup page
    await expect(page.locator('[data-ai-id="setup-main-card"]')).toBeVisible({ timeout: 60000 });

    // Complete setup quickly by going through all steps
    // Step 1: Welcome - click next
    await page.click('[data-ai-id="setup-welcome-next-button"]');

    // Step 2: Seeding - populate and verify
    await page.click('[data-ai-id="setup-seeding-populate-button"]');
    // Wait for population to complete
    await expect(page.locator('[data-ai-id="setup-seeding-populate-button"]')).toHaveText(/Popular com Dados de Demonstração/, { timeout: 180000 });
    await page.click('[data-ai-id="setup-seeding-verify-button"]');

    // Step 3: Admin User - fill and submit
    await page.fill('[data-ai-id="setup-admin-fullname-input"]', 'Test Admin');
    await page.fill('[data-ai-id="setup-admin-email-input"]', 'test@admin.com');
    await page.fill('[data-ai-id="setup-admin-password-input"]', 'Test@123');
    await page.click('[data-ai-id="setup-admin-create-button"]');

    // Step 4: Finish - complete setup
    await expect(page.locator('[data-ai-id="setup-finish-button"]')).toBeVisible({ timeout: 60000 });
    await page.click('[data-ai-id="setup-finish-button"]');

    // Should redirect to admin area
    await expect(page).toHaveURL(/\/admin/, { timeout: 180000 });
  });

  test('should load homepage when setup is complete', async ({ page }) => {
    // Set setup as complete to bypass setup flow
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
      window.localStorage.removeItem('bidexpert-subscription-popup-seen');
    });

    await page.goto('/', { timeout: 300000 });

    // Should not redirect to setup
    await expect(page).not.toHaveURL(/\/setup/, { timeout: 30000 });

    // Handle subscription modal if it appears
    const subscriptionModal = page.locator('[data-ai-id="subscription-modal"]');
    if (await subscriptionModal.isVisible({ timeout: 10000 })) {
      // Close modal without subscribing
      await page.click('[data-ai-id="subscription-close-button"]');
      await expect(subscriptionModal).not.toBeVisible({ timeout: 5000 });
    }

    // Should show main content
    await expect(page.locator('main, [data-ai-id="main-content"]')).toBeVisible({ timeout: 60000 });

    // Should show header/navigation
    await expect(page.locator('header, nav, [data-ai-id="header"]')).toBeVisible({ timeout: 30000 });
  });

  test('should load login page', async ({ page }) => {
    // Set setup as complete
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    await page.goto('/auth/login', { timeout: 300000 });

    // Should show login form
    await expect(page.locator('[data-ai-id="auth-login-form"], form')).toBeVisible({ timeout: 60000 });

    // Should have email and password fields
    await expect(page.locator('input[type="email"], [data-ai-id="auth-login-email-input"]')).toBeVisible();
    await expect(page.locator('input[type="password"], [data-ai-id="auth-login-password-input"]')).toBeVisible();

    // Should have submit button
    await expect(page.locator('button[type="submit"], [data-ai-id="auth-login-submit-button"]')).toBeVisible();
  });

  test('should perform basic login flow', async ({ page }) => {
    // Set setup as complete
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    await page.goto('/auth/login', { timeout: 300000 });

    // Handle subscription modal if it appears
    const subscriptionModal = page.locator('[data-ai-id="subscription-modal"]');
    if (await subscriptionModal.isVisible({ timeout: 10000 })) {
      await page.click('[data-ai-id="subscription-close-button"]');
    }

    // Fill login form
    await page.fill('input[type="email"], [data-ai-id="auth-login-email-input"]', 'admin@bidexpert.com.br');
    await page.fill('input[type="password"], [data-ai-id="auth-login-password-input"]', 'Admin@123');

    // Submit form
    await page.click('button[type="submit"], [data-ai-id="auth-login-submit-button"]');

    // Should redirect to dashboard or admin area
    await expect(page).toHaveURL(/\/dashboard|\/admin/, { timeout: 300000 });

    // Should show dashboard content
    await expect(page.locator('[data-ai-id="dashboard"], main, .dashboard')).toBeVisible({ timeout: 60000 });
  });
});
