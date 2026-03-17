import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth-helper';

const PORT = process.env.PORT || '9006';
const BASE_URL = `http://demo.localhost:${PORT}`;

test.describe('Query Monitor Feature Flag', () => {
  test.setTimeout(120000);

  test('should toggle query monitor from admin header', async ({ page }) => {
    // 1. Login as admin
    await loginAsAdmin(page, BASE_URL);

    // 2. Navigate to admin dashboard
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for the page to be interactive (admin layout rendering complete)
    await page.waitForSelector('[data-ai-id="admin-header-search-button"]', { timeout: 60000 });

    // Debug: take screenshot of current state
    await page.screenshot({ path: 'test-results/admin-header-debug.png' });

    // 3. Locate the toggle in the header
    const toggleContainer = page.locator('[data-ai-id="admin-header-query-monitor-toggle"]');
    await expect(toggleContainer).toBeVisible({ timeout: 15000 });

    const toggle = page.locator('#query-monitor-toggle');

    // The QueryMonitor renders a fixed bar at the bottom with "Query Monitor" text
    const monitorBar = page.locator('text=Query Monitor').first();

    // 4. Initial state: ensure toggle is OFF
    const isChecked = await toggle.getAttribute('data-state');
    if (isChecked === 'checked') {
      await toggle.click();
      await page.waitForTimeout(500);
    }

    // 5. Verify Query Monitor bar is NOT visible when toggle is off
    await expect(monitorBar).not.toBeVisible();

    // 6. Toggle ON
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-state', 'checked');

    // 7. Verify Query Monitor bar appears (dynamic import may take a moment)
    await expect(monitorBar).toBeVisible({ timeout: 15000 });

    // 8. Toggle OFF
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-state', 'unchecked');
    await expect(monitorBar).not.toBeVisible({ timeout: 5000 });

    // 9. Persistency: toggle ON, reload, check it persists
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-state', 'checked');
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[data-ai-id="admin-header-query-monitor-toggle"]', { timeout: 60000 });
    
    const toggleAfterReload = page.locator('#query-monitor-toggle');
    await expect(toggleAfterReload).toHaveAttribute('data-state', 'checked');
    await expect(monitorBar).toBeVisible({ timeout: 15000 });
  });
});
