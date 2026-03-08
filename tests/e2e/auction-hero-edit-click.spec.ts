import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth-helper';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://demo.localhost:9015';
const AUCTION_PATH = '/auctions/auction-mg-1772496172307-1';

test.describe('Auction hero edit button', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
  });

  test('allows clicking edit button on auction hero', async ({ page }) => {
    await page.goto(`${BASE_URL}${AUCTION_PATH}`, { waitUntil: 'networkidle' });

    const editButton = page.locator('[data-ai-id="hero-edit-auction-btn"]');
    await expect(editButton).toBeVisible();
    await editButton.click();

    await expect(page).toHaveURL(/\/admin\/auctions\/.+\/edit/);
  });
});
