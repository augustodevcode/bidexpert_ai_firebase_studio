import { test, expect } from '@playwright/test';

test.describe('Consignor Logo Click', () => {
  test('should navigate to seller page when clicking consignor logo on auction card', async ({ page }) => {
    // Navigate to auctions page
    await page.goto('http://localhost:9002/auctions');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find an auction card with consignor logo
    const logoElement = page.locator('[data-ai-hint="logo comitente pequeno"]').first();

    // Check if logo exists
    await expect(logoElement).toBeVisible();

    // Click on the logo
    await logoElement.click();

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Check if navigated to seller page (URL should contain /sellers/)
    await expect(page.url()).toMatch(/\/sellers\//);
  });
});