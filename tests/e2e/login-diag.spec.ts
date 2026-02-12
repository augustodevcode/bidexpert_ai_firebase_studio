/**
 * @fileoverview Test de diagnóstico do login admin — minimal test to verify login flow
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://demo.localhost:9005';

test.setTimeout(180_000);

test('Login admin - diagnóstico', async ({ page }) => {
  // Capture all console output
  page.on('console', msg => {
    console.log(`[Browser ${msg.type()}]: ${msg.text()}`);
  });

  // 1. Navigate to login
  console.log('>>> Navigating to login page...');
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 120000 });
  console.log('>>> Login page loaded:', page.url());

  // 2. Wait for form
  console.log('>>> Waiting for login form...');
  await page.waitForSelector('[data-ai-id="auth-login-email-input"]', { timeout: 120000 });
  console.log('>>> Login form visible');

  // 3. Wait for tenant context to resolve (2 extra seconds)
  await page.waitForTimeout(3000);

  // 4. Check if there's a tenant selector or locked tenant
  const tenantSelector = page.locator('[data-ai-id="auth-login-tenant-selector"], select, [data-ai-id*="tenant"]');
  const tenantCount = await tenantSelector.count();
  console.log('>>> Tenant selector count:', tenantCount);

  // Check for locked tenant indicator
  const lockedTenant = page.locator('[data-ai-id*="locked-tenant"], .text-muted-foreground:has-text("Espaço de Trabalho")');
  const lockedCount = await lockedTenant.count();
  console.log('>>> Locked tenant indicators:', lockedCount);

  // 5. Take screenshot before login
  await page.screenshot({ path: 'test-results/login-diag-before.png', fullPage: true });
  console.log('>>> Screenshot saved: login-diag-before.png');

  // 6. Fill form
  await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
  await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');
  console.log('>>> Form filled');

  // 7. Take screenshot after fill
  await page.screenshot({ path: 'test-results/login-diag-filled.png', fullPage: true });

  // 8. Click submit
  await page.locator('[data-ai-id="auth-login-submit-button"]').click();
  console.log('>>> Submit clicked');

  // 9. Wait for response with generous timeout
  try {
    await page.waitForURL(/\/(admin|dashboard)/i, { timeout: 30000 });
    console.log('>>> Redirected to:', page.url());
    await page.screenshot({ path: 'test-results/login-diag-success.png', fullPage: true });
    console.log('>>> LOGIN SUCCESS');
  } catch (e) {
    console.log('>>> Redirect did NOT happen within 30s. Current URL:', page.url());
    await page.screenshot({ path: 'test-results/login-diag-failed.png', fullPage: true });
    
    // Check for error messages on page
    const errorText = await page.locator('[role="alert"], .text-destructive, [class*="error"]').allTextContents();
    console.log('>>> Error messages on page:', JSON.stringify(errorText));
    
    // Check page content
    const bodyText = await page.textContent('body');
    console.log('>>> Page body text (first 500 chars):', bodyText?.substring(0, 500));
    
    throw new Error(`Login redirect failed. Current URL: ${page.url()}`);
  }
});
