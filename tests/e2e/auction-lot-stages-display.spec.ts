import { test, expect } from '@playwright/test';

const TEST_AUCTION_ID = 'AUC-f4f6c355-cb92-4a5e-9aa0-d1f38e9928d6';

test.describe('Auction lot cards', () => {
  test('display auction stages timeline within lot cards', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/auctions/${TEST_AUCTION_ID}`, { waitUntil: 'networkidle' });

    await page.getByRole('tab', { name: /lotes/i }).click();

    const gridToggle = page.getByRole('button', { name: /visualização em grade/i });
    if (await gridToggle.isVisible()) {
      await gridToggle.click({ delay: 50 });
    }

    const firstLotCard = page.locator('[data-ai-id^="lot-card-"]').first();
    await firstLotCard.waitFor({ state: 'visible' });

    const auctionInfoSection = firstLotCard.locator('[data-ai-id="lot-card-auction-info"]');
    await auctionInfoSection.waitFor({ state: 'visible' });
    await expect(auctionInfoSection.getByText('Leilão:', { exact: false })).toBeVisible();

    const timeline = auctionInfoSection.locator('[data-ai-id="auction-card-timeline"]');
    await timeline.waitFor({ state: 'visible' });
    await expect(timeline).toBeVisible();
  });
});
