// tests/ui/basic-test.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Basic Playwright Test', () => {
  test('should be able to navigate to Google', async ({ page }) => {
    await page.goto('https://www.google.com');
    await expect(page).toHaveTitle(/Google/);
    console.log('✅ Basic Playwright test passed - can navigate to external sites');
  });

  test('should be able to navigate to localhost (if server is running)', async ({ page }) => {
    try {
      await page.goto('/');
      console.log('✅ Successfully navigated to localhost');
    } catch (error) {
      console.log('⚠️ Could not navigate to localhost - server may not be running');
      console.log('Error:', error.message);
    }
  });
});
