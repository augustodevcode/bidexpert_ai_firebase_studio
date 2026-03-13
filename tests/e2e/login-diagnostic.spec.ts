/**
 * Test to verify the login flow works after fixing cookies() await issue.
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://demo.localhost:9006';

test.use({ viewport: { width: 1280, height: 720 } });

test('login as admin should succeed and redirect to dashboard', async ({ page }) => {
  test.setTimeout(120_000);

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Go to login page
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 90_000 });

  // Check if DevUserSelector is present (quick login)
  const devSelector = page.locator('[data-ai-id="dev-user-selector"]');
  const hasDevSelector = await devSelector.isVisible().catch(() => false);

  if (hasDevSelector) {
    console.log('DevUserSelector found — looking for admin quick login');
    // Try clicking admin user in dev selector
    const adminBtn = page.locator('text=admin@bidexpert.com.br').first();
    const hasAdminBtn = await adminBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasAdminBtn) {
      await adminBtn.click();
      console.log('Clicked admin quick login');
      // Wait for navigation
      await page.waitForURL('**/dashboard/**', { timeout: 30_000 }).catch(() => {});
      const finalUrl = page.url();
      console.log('Final URL after DevSelector login:', finalUrl);
      if (finalUrl.includes('/dashboard')) {
        console.log('✅ Login via DevSelector succeeded');
        return;
      }
    }
  }

  // Manual login flow
  console.log('Performing manual login...');

  // Fill email
  const emailInput = page.locator('input[type="email"], input[name="email"], [data-ai-id*="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 10_000 });
  await emailInput.fill('admin@bidexpert.com.br');

  // Fill password
  const passwordInput = page.locator('input[type="password"], input[name="password"], [data-ai-id*="password"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: 5_000 });
  await passwordInput.fill('Admin@123');

  // Check tenant selector state
  const tenantSelect = page.locator('[data-ai-id="auth-login-tenant-select"]');
  const tenantVisible = await tenantSelect.isVisible().catch(() => false);
  console.log('Tenant selector visible:', tenantVisible);
  if (tenantVisible) {
    const isDisabled = await tenantSelect.isDisabled().catch(() => false);
    console.log('Tenant selector disabled (auto-locked):', isDisabled);
  }

  // Submit
  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.waitFor({ state: 'visible', timeout: 5_000 });

  // Listen for server action response
  const responsePromise = page.waitForResponse(
    (resp) => resp.url().includes('login') || resp.url().includes('_next'),
    { timeout: 30_000 }
  ).catch(() => null);

  await submitBtn.click();
  console.log('Submit clicked, waiting for response...');

  const resp = await responsePromise;
  if (resp) {
    console.log('Response:', resp.status(), resp.url().substring(0, 80));
  }

  // Wait for redirect or error
  await page.waitForTimeout(3000);
  const urlAfterLogin = page.url();
  console.log('URL after login attempt:', urlAfterLogin);

  // Check for error messages
  const errorMsg = page.locator('[role="alert"], .text-destructive, [data-ai-id*="error"]');
  const hasError = await errorMsg.first().isVisible({ timeout: 2000 }).catch(() => false);
  if (hasError) {
    const errorText = await errorMsg.first().textContent();
    console.log('❌ Login error message:', errorText);
  }

  // Check for toast errors
  const toast = page.locator('[data-sonner-toast], [role="status"]');
  const hasToast = await toast.first().isVisible({ timeout: 2000 }).catch(() => false);
  if (hasToast) {
    const toastText = await toast.first().textContent();
    console.log('Toast message:', toastText);
  }

  // Check console errors
  if (consoleErrors.length > 0) {
    console.log('Console errors during login:');
    consoleErrors.forEach((e) => console.log('  -', e.substring(0, 200)));
  }

  // Try waiting for dashboard redirect with longer timeout
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 }).catch(() => {});
  const finalUrl = page.url();
  console.log('Final URL:', finalUrl);

  // Assert success
  expect(finalUrl).toContain('/dashboard');
});
