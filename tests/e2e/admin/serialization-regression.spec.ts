/**
 * @fileoverview E2E regression tests for BigInt/Decimal serialization.
 *
 * Feature: BigInt/Decimal Serialization Regression
 *   As a developer
 *   I want to verify that API endpoints returning BigInt or Decimal values
 *   do not cause 500 Internal Server Errors
 *   So that JSON serialization issues are caught early
 *
 * Scenario: API endpoints return valid JSON without serialization errors
 *   Given the server is running
 *   When I fetch API endpoints known to return BigInt/Decimal values
 *   Then each should return a 2xx/3xx status (not 500)
 *   And the response body should be valid JSON
 *
 * Covers gap D6 from the 30-feature audit.
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth-helper';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9002';

// API endpoints known to return BigInt or Decimal values
const BIGINT_ENDPOINTS = [
  { path: '/api/v1/admin/tenants', method: 'GET', needsAuth: true },
  { path: '/api/debug/lots', method: 'GET', needsAuth: false },
  { path: '/api/public/lots', method: 'GET', needsAuth: false },
  { path: '/api/public/auctions', method: 'GET', needsAuth: false },
] as const;

// Pages known to render data with BigInt/Decimal
const PAGES_WITH_NUMBERS = [
  { path: '/search', label: 'Search (lots with prices)' },
  { path: '/admin/auctions', label: 'Admin auctions list' },
] as const;

test.describe('BigInt/Decimal Serialization Regression', () => {
  test('Public API endpoints return valid JSON (no serialization crashes)', async ({ request }) => {
    for (const endpoint of BIGINT_ENDPOINTS) {
      if (endpoint.needsAuth) continue; // Skip auth-required endpoints in this test

      const response = await request.get(`${BASE_URL}${endpoint.path}`, {
        timeout: 30_000,
      });

      // Must not be a 500 (serialization error)
      expect(
        response.status(),
        `${endpoint.path} returned ${response.status()}`
      ).toBeLessThan(500);

      // If 200, body must be valid JSON
      if (response.status() === 200) {
        const body = await response.text();
        expect(() => JSON.parse(body), `${endpoint.path} returned invalid JSON`).not.toThrow();
      }
    }
  });

  test('Admin API endpoints return valid JSON with auth', async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);

    for (const endpoint of BIGINT_ENDPOINTS) {
      if (!endpoint.needsAuth) continue;

      const response = await page.request.get(`${BASE_URL}${endpoint.path}`, {
        timeout: 30_000,
      });

      expect(
        response.status(),
        `${endpoint.path} returned ${response.status()}`
      ).toBeLessThan(500);

      if (response.status() === 200) {
        const body = await response.text();
        expect(() => JSON.parse(body), `${endpoint.path} invalid JSON`).not.toThrow();
      }
    }
  });

  test('Pages with numeric data render without JS errors', async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
    const jsErrors: Array<{ page: string; error: string }> = [];

    page.on('pageerror', (err) => {
      jsErrors.push({ page: page.url(), error: err.message });
    });

    for (const p of PAGES_WITH_NUMBERS) {
      const response = await page.goto(`${BASE_URL}${p.path}`, {
        waitUntil: 'networkidle',
        timeout: 60_000,
      });

      expect(
        response?.status(),
        `${p.label} (${p.path}) returned ${response?.status()}`
      ).toBeLessThan(500);
    }

    // Filter for serialization-related JS errors
    const serializationErrors = jsErrors.filter(
      (e) => /BigInt|serialize|cannot convert|circular/i.test(e.error)
    );

    expect(
      serializationErrors,
      `Found ${serializationErrors.length} serialization errors: ${JSON.stringify(serializationErrors)}`
    ).toHaveLength(0);
  });

  test('Lot detail page with Decimal prices renders', async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);

    // Navigate to auctions list and find a lot
    await page.goto(`${BASE_URL}/admin/auctions`, {
      waitUntil: 'networkidle',
      timeout: 60_000,
    });

    // Find first auction link
    const auctionLink = page.locator('a[href*="/auctions/"]').first();
    if (!(await auctionLink.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip(true, 'No auctions found in seed data');
      return;
    }

    await auctionLink.click();
    await page.waitForTimeout(3_000);

    // Check for serialization/rendering errors on the page
    const errorIndicator = page.locator('text=/Internal Server Error|Cannot read properties|BigInt/i').first();
    const hasError = await errorIndicator.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasError).toBe(false);
  });
});
