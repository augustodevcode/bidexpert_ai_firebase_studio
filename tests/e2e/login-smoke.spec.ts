/**
 * @fileoverview Smoke test for login flow - validates full login + redirect to dashboard.
 * 
 * Key findings from diagnostics:
 * 1. React hydration works on first load (hasReactFiber: true)
 * 2. Tenant resolution is async — must wait for tenant selector to be populated
 * 3. After login, redirect uses window.location.href (full page reload)
 * 4. Dashboard /overview compilation may take time on first load
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://demo.localhost:9006';

test.describe('Login Flow Smoke Test', () => {
  test.setTimeout(120_000);

  test('should login as admin and redirect to dashboard', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') jsErrors.push(msg.text());
    });
    page.on('pageerror', err => jsErrors.push(`PAGE: ${err.message}`));

    // 1. Navigate to login page  
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 90_000 });
    
    // 2. Verify React hydrated — wait for the login card
    await expect(page.locator('[data-ai-id="auth-login-card"]')).toBeVisible({ timeout: 15_000 });
    
    // 3. CRITICAL: Wait for tenant selector to be populated and show "BidExpert Demo"
    //    This is async — depends on /api/public/tenants fetch + subdomain resolution
    const tenantSelect = page.locator('[data-ai-id="auth-login-tenant-select"]');
    await expect(tenantSelect).toBeVisible({ timeout: 15_000 });
    
    // Wait until the tenant text shows "BidExpert Demo" (not loading/placeholder)
    // Timeout is generous because dev server may be compiling other pages in parallel  
    await expect(tenantSelect).toContainText(/BidExpert|Demo/i, { timeout: 60_000 });
    console.log('✅ Tenant selector populated');
    
    // 4. Wait a moment for React state to settle (tenant ID set in form)
    await page.waitForTimeout(2_000);
    
    // 5. Verify React hydration by checking for __reactFiber
    const hasReact = await page.evaluate(() => {
      const form = document.querySelector('[data-ai-id="auth-login-form"]');
      return form ? Object.keys(form).some(k => k.startsWith('__react')) : false;
    });
    console.log(`React hydration: ${hasReact}`);
    expect(hasReact).toBe(true);
    
    // 6. Fill credentials using .fill() (triggers React change events)
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    
    await emailInput.fill('admin@bidexpert.com.br');
    await passwordInput.fill('Admin@123');
    
    // 7. Verify values
    await expect(emailInput).toHaveValue('admin@bidexpert.com.br');
    await expect(passwordInput).toHaveValue('Admin@123');
    console.log('✅ Credentials filled');
    
    // 8. Submit and wait for navigation
    const submitButton = page.locator('[data-ai-id="auth-login-submit-button"]');
    await expect(submitButton).toBeEnabled({ timeout: 5_000 });
    
    // Use Promise.all with submitButton.click() and waitForURL
    // The login does window.location.href = redirectUrl after 300ms delay
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/auth/login'), { timeout: 90_000 }),
      submitButton.click(),
    ]);
    
    const finalUrl = page.url();
    console.log(`✅ Navigated to: ${finalUrl}`);
    expect(finalUrl).toContain('/dashboard');
    
    // 9. Verify dashboard loaded
    await expect(page.locator('body')).toBeVisible({ timeout: 30_000 });
    const pageText = await page.textContent('body');
    expect(pageText!.length).toBeGreaterThan(100);
    console.log(`✅ Dashboard loaded (${pageText!.length} chars)`);
    
    // 10. Check for critical JS errors (ignore dev-mode artifacts)
    const criticalErrors = jsErrors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('currency/rates') && 
      !e.includes('hot-update') &&
      !e.includes('Session check failed')
    );
    console.log(`JS errors: ${criticalErrors.length} critical, ${jsErrors.length} total`);
    if (criticalErrors.length > 0) {
      criticalErrors.forEach(e => console.log(`  ⚠️ ${e.substring(0, 150)}`));
    }
  });
});
