/**
 * @fileoverview Generates admin storageState for Playwright sweep tests.
 * Usage: node scripts/gen-admin-auth.mjs
 */
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://demo.localhost:9010';
const AUTH_FILE = 'tests/e2e/.auth/admin.json';

async function main() {
  console.log(`[gen-admin-auth] BASE_URL=${BASE}`);
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Listen for all console messages
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text().slice(0, 200)}`);
  });

  console.log('[gen-admin-auth] Navigating to login...');
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  // Fill email using data-ai-id
  const emailInput = page.locator('[data-ai-id="auth-login-email-input"]');
  await emailInput.fill('admin@bidexpert.com.br');
  console.log('[gen-admin-auth] Email filled');

  // Fill password using data-ai-id
  const passwordInput = page.locator('[data-ai-id="auth-login-password-input"]');
  await passwordInput.fill('Admin@123');
  console.log('[gen-admin-auth] Password filled');

  await page.screenshot({ path: 'tests/e2e/.debug/login-filled.png', fullPage: true });

  // Submit using data-ai-id
  const submitBtn = page.locator('[data-ai-id="auth-login-submit-button"]');
  await submitBtn.click();
  console.log('[gen-admin-auth] Clicked submit');

  // Wait for network to settle
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'tests/e2e/.debug/login-after-submit.png', fullPage: true });

  const urlAfterSubmit = page.url();
  console.log('[gen-admin-auth] URL after submit:', urlAfterSubmit);

  // Check for error messages
  const errors = await page.$$eval('[role="alert"], .text-destructive, [data-ai-id*="error"]', els =>
    els.map(e => e.textContent?.trim()).filter(Boolean)
  );
  if (errors.length > 0) {
    console.log('[gen-admin-auth] Error messages on page:', errors);
  }

  // If still on login, wait longer (lazy compilation may be slow)
  if (urlAfterSubmit.includes('/auth/login')) {
    console.log('[gen-admin-auth] Still on login page, waiting longer...');
    try {
      await page.waitForURL(url => !url.toString().includes('/auth/login'), {
        timeout: 60000,
        waitUntil: 'domcontentloaded',
      });
    } catch {
      await page.screenshot({ path: 'tests/e2e/.debug/login-final-fail.png', fullPage: true });
      const finalErrors = await page.$$eval('[role="alert"], .text-destructive, .text-red-500, [data-ai-id*="error"]', els =>
        els.map(e => e.textContent?.trim()).filter(Boolean)
      );
      console.error('[gen-admin-auth] FAILED. Final URL:', page.url());
      console.error('[gen-admin-auth] Errors:', finalErrors);
      await browser.close();
      process.exit(1);
    }
  }

  console.log('[gen-admin-auth] Login successful! URL:', page.url());
  await page.waitForTimeout(2000);
  await ctx.storageState({ path: AUTH_FILE });
  console.log(`[gen-admin-auth] Admin auth state saved to ${AUTH_FILE}`);
  await browser.close();
}

main().catch(err => {
  console.error('[gen-admin-auth] Fatal:', err.message);
  process.exit(1);
});
