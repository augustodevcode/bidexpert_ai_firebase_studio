/**
 * @fileoverview E2E tests for the Profile Edit redirect and form.
 *
 * Feature: Admin Profile Edit
 *   As a logged-in user
 *   I want /profile/edit to redirect to /dashboard/profile/edit
 *   And I want the profile edit form to work correctly
 *
 * Scenario: Legacy route redirects to dashboard profile edit
 *   Given I am logged in as admin
 *   When I navigate to /profile/edit
 *   Then I should be redirected to /dashboard/profile/edit
 *
 * Scenario: Profile edit form loads with user data
 *   Given I am logged in as admin
 *   When I navigate to /dashboard/profile/edit
 *   Then I should see a form pre-filled with my profile data
 *
 * Covers gap C7 from the 30-feature audit.
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth-helper';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9002';

test.describe('Admin Profile Edit', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
  });

  test('Legacy /profile/edit redirects to /dashboard/profile/edit', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile/edit`, {
      waitUntil: 'networkidle',
      timeout: 60_000,
    });

    // Should have redirected
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/dashboard\/profile\/edit/i);
  });

  test('Profile edit page loads with form', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/profile/edit`, {
      waitUntil: 'networkidle',
      timeout: 60_000,
    });

    // Should have a form
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 15_000 });

    // Should have name/email fields pre-filled
    const nameInput = page.locator('input[name="name"], input[name="fullName"], input[placeholder*="nome"]').first();
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();

    const hasName = await nameInput.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmail = await emailInput.isVisible({ timeout: 5_000 }).catch(() => false);

    expect(hasName || hasEmail).toBe(true);

    // If email is visible, verify it's pre-filled
    if (hasEmail) {
      const emailValue = await emailInput.inputValue();
      expect(emailValue.length).toBeGreaterThan(0);
    }
  });

  test('Profile edit page does not return 500', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/dashboard/profile/edit`, {
      waitUntil: 'networkidle',
      timeout: 60_000,
    });

    if (response) {
      expect(response.status()).toBeLessThan(500);
    }

    // No unhandled error on the page
    const errorText = page.locator('text=/Internal Server Error|500|Application error/i').first();
    const hasError = await errorText.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasError).toBe(false);
  });
});
