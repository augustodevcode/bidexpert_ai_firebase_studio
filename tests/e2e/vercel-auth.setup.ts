/**
 * Vercel Auth Setup — visits the share URL to acquire the _vercel_jwt cookie,
 * then persists storage state so all subsequent specs skip the SSO gate.
 */
import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const VERCEL_SHARE_TOKEN = process.env.VERCEL_SHARE_TOKEN || '';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://demo.bidexpert.com.br';
const STORAGE_STATE_PATH = path.resolve('./playwright/.vercel-auth.json');

setup('obtain Vercel SSO cookie via share link', async ({ page }) => {
  setup.skip(!VERCEL_SHARE_TOKEN, 'VERCEL_SHARE_TOKEN not set — skipping auth setup');

  // Ensure output directory exists
  const dir = path.dirname(STORAGE_STATE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const shareUrl = `${BASE_URL}/?_vercel_share=${VERCEL_SHARE_TOKEN}`;
  console.log(`[vercel-auth-setup] Navigating to share URL: ${shareUrl}`);

  const response = await page.goto(shareUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });

  // The share link should resolve (possibly via redirect) to ≤ 399
  const status = response?.status() ?? 0;
  console.log(`[vercel-auth-setup] Response status: ${status}`);

  if (status === 401 || status === 403) {
    // Share link itself returned auth error — token might be expired,
    // or protection type doesn't support share links.
    // Save empty state so tests can detect and skip gracefully.
    console.warn('[vercel-auth-setup] Share link returned 401/403 — SSO bypass not available');
    await page.context().storageState({ path: STORAGE_STATE_PATH });
    return;
  }

  expect(status).toBeLessThan(400);

  // Wait a moment for any async cookie setting
  await page.waitForTimeout(3_000);

  // Persist the authenticated storage state (cookies + localStorage)
  await page.context().storageState({ path: STORAGE_STATE_PATH });

  // Verify the cookie exists
  const cookies = await page.context().cookies();
  const jwtCookie = cookies.find(c => c.name === '_vercel_jwt');
  if (jwtCookie) {
    console.log('[vercel-auth-setup] _vercel_jwt cookie acquired successfully');
  } else {
    console.warn('[vercel-auth-setup] _vercel_jwt cookie NOT found — tests may still get 401');
  }
});
