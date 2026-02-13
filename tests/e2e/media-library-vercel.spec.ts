/**
 * @fileoverview Teste E2E da Media Library no Vercel Production.
 * Valida que os componentes Google Photos-like foram deployados corretamente.
 * 
 * Usage: npx playwright test tests/e2e/media-library-vercel.spec.ts --config=playwright.vercel.config.ts
 */

import { test, expect, type Page } from '@playwright/test';

const VERCEL_URL = 'https://bidexpertaifirebasestudio.vercel.app';

test.setTimeout(120_000);

/** Helper: Login as admin on Vercel */
async function loginAsAdmin(page: Page) {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('[Browser Error]: ' + msg.text());
    }
  });

  console.log('Navigating to login page...');
  await page.goto(VERCEL_URL + '/auth/login', { waitUntil: 'networkidle', timeout: 60000 });
  
  await page.waitForSelector('[data-ai-id="auth-login-email-input"]', { timeout: 30000 });
  console.log('Login form visible');

  await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
  await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');

  await Promise.all([
    page.waitForURL(/\/(admin|dashboard)/i, { timeout: 60000 }),
    page.locator('[data-ai-id="auth-login-submit-button"]').click({ timeout: 30000 }),
  ]);
  console.log('Login OK:', page.url());
  return errors;
}

test.describe('Media Library - Vercel Production', () => {

  test('V01 - Deve carregar a pagina de media no Vercel', async ({ page }) => {
    const loginErrors = await loginAsAdmin(page);
    
    console.log('Navigating to /admin/media...');
    await page.goto(VERCEL_URL + '/admin/media', { waitUntil: 'networkidle', timeout: 60000 });
    
    // Check if media page container exists
    const mediaContainer = page.locator('[data-ai-id="admin-media-page-container"]');
    await expect(mediaContainer).toBeVisible({ timeout: 30000 });
    console.log('Media page container visible');

    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/vercel-media-library.png', fullPage: true });
    console.log('Screenshot saved');
  });

  test('V02 - Deve exibir toolbar da galeria', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(VERCEL_URL + '/admin/media', { waitUntil: 'networkidle', timeout: 60000 });
    
    // Check for Google Photos toolbar
    const toolbar = page.locator('[data-ai-id="media-toolbar"]');
    await expect(toolbar).toBeVisible({ timeout: 30000 });
    console.log('Toolbar visible');

    // Check search field
    const searchField = page.locator('[data-ai-id="media-toolbar-search"]');
    await expect(searchField).toBeVisible({ timeout: 10000 });
    console.log('Search field visible');
  });

  test('V03 - Deve exibir galeria com cards', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(VERCEL_URL + '/admin/media', { waitUntil: 'networkidle', timeout: 60000 });
    
    // Check for gallery cards
    const galleryCards = page.locator('[data-ai-id="media-gallery-card"]');
    const count = await galleryCards.count();
    console.log(`Found ${count} gallery cards`);
    
    expect(count).toBeGreaterThan(0);
  });

  test('V04 - Pagina nao deve ter erros 500', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    page.on('response', response => {
      if (response.status() >= 500) {
        console.log(`[500 Error]: ${response.url()} - ${response.status()}`);
        errors.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    });

    await loginAsAdmin(page);
    await page.goto(VERCEL_URL + '/admin/media', { waitUntil: 'networkidle', timeout: 60000 });
    
    // Filter for critical errors (500s, not just "Failed to fetch" which can be transient)
    const criticalErrors = errors.filter(e => 
      e.includes('500') || e.includes('Internal Server Error')
    );
    
    console.log(`Total console errors: ${errors.length}, Critical: ${criticalErrors.length}`);
    expect(criticalErrors.length).toBe(0);
  });
});
