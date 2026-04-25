import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth-helper';

const PORT = process.env.PORT || '9006';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://demo.localhost:${PORT}`;

test.describe('Admin global search', () => {
  test.setTimeout(120000);

  test('opens via header and navigates immediately after selecting a result', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'chromium-noauth', 'requires authenticated admin session');

    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });

    if (page.url().includes('/auth/login')) {
      await loginAsAdmin(page, BASE_URL);
      await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    }

    const searchButton = page.locator('[data-ai-id="admin-header-search-button"]');
    await expect(searchButton).toBeVisible({ timeout: 60000 });
    await expect(page.locator('[data-ai-id="admin-header-kbd"]')).toContainText(/Ctrl\+K|Cmd\+K/);

    await searchButton.click();

    const commandInput = page.locator('input[cmdk-input]');
    await expect(commandInput).toBeVisible({ timeout: 10000 });

    await commandInput.fill('Lotes');

    const lotesNavItem = page.locator('[data-ai-id="cmd-nav-lotes"]');
    await expect(lotesNavItem).toBeVisible({ timeout: 10000 });
    await lotesNavItem.evaluate((node) => {
      (node as HTMLElement).click();
    });

    await expect(page).toHaveURL(/\/admin\/lots(\/|$|\?)/);
  });
});
