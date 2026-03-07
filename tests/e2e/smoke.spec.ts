import { test, expect } from '@playwright/test';

test.describe('Smoke Test', () => {
  test('should load the homepage and have a title', async ({ page }) => {
    // Navigate to the base URL (http://localhost:3001)
    await page.goto('/');

    // Wait for the title to be present and not empty
    await expect(page).toHaveTitle(/.+/, { timeout: 30000 }); // Wait up to 30s for a title

    console.log('Page title:', await page.title());
  });
});
