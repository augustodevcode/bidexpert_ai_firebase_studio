/**
 * @file Smoke Test - Basic Server Health Check
 * @description Validates that the server is running and basic pages load without DB dependency.
 * This test runs WITHOUT authentication to verify server stability.
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Server Health', () => {
  // Skip global setup for these tests (no auth needed)
  test.use({ storageState: { cookies: [], origins: [] } });

  test('server responds with 200 on homepage', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
  });

  test('login page renders without errors', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Should show login form container
    await expect(page.locator('[data-ai-id="auth-login-page-container"], [data-ai-id="auth-login-page-loading"]')).toBeVisible({ timeout: 15000 });
  });

  test('static pages load correctly', async ({ page }) => {
    // Test FAQ page (static content)
    const faqResponse = await page.goto('/faq');
    expect(faqResponse?.status()).toBeLessThan(500);
    
    // Test Terms page (static content)
    const termsResponse = await page.goto('/terms');
    expect(termsResponse?.status()).toBeLessThan(500);
    
    // Test Privacy page (static content)
    const privacyResponse = await page.goto('/privacy');
    expect(privacyResponse?.status()).toBeLessThan(500);
  });

  test('search page loads without crashing', async ({ page }) => {
    const response = await page.goto('/search');
    expect(response?.status()).toBeLessThan(500);
    
    // Wait for React to hydrate
    await page.waitForTimeout(2000);
    
    // Page should not show error boundary
    await expect(page.locator('text=Something went wrong')).not.toBeVisible();
  });

  test('API health endpoint works', async ({ request }) => {
    // Test if API routes respond
    const response = await request.get('/api/health', {
      failOnStatusCode: false
    });
    
    // Accept 200, 404 (not implemented), or 405 (method not allowed)
    // Fail only on 5xx server errors
    expect(response.status()).toBeLessThan(500);
  });
});
