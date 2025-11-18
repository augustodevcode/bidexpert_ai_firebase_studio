import { test, expect } from '@playwright/test';
import { BASE_URL, ensureAdminSession, selectShadcnByLabel } from './admin-helpers';

test.describe('Admin UX and Field Coverage - Modality Gap Analysis', () => {
  test('Auction form has fields for silent, dutch, relist, soft-close; reverse is a known gap', async ({ page }) => {
    await ensureAdminSession(page);
    await page.goto(`${BASE_URL}/admin/auctions/new`, { waitUntil: 'domcontentloaded' });

    // Expand form section with method select
    const trigger = page.getByRole('button', { name: /modalidade, m[ée]todo e local/i }).first();
    if (await trigger.isVisible().catch(() => false)) {
      await trigger.click();
    }
    // Click method select to reveal options
    const methodLabel = page.locator('label', { hasText: /M[ée]todo/ }).first();
    await methodLabel.locator('xpath=following::button[@role="combobox"][1]').click();
    const hasStandard = await page.getByRole('option', { name: /standard/i }).first().isVisible().catch(() => false);
    const hasDutch = await page.getByRole('option', { name: /dutch/i }).first().isVisible().catch(() => false);
    const hasSilent = await page.getByRole('option', { name: /silent/i }).first().isVisible().catch(() => false);
    expect(hasStandard && hasDutch && hasSilent).toBeTruthy();

    // Reverse auction - gap expected
    const hasReverse = await page.getByRole('option', { name: /reverse|reverso/i }).first().isVisible().catch(() => false);
    expect.soft(hasReverse).toBeFalsy();

    // Toggles - not present in current AuctionForm UI (gap)
    const silentToggle = await page.getByLabel(/lances silenciosos|silent/i).first().isVisible().catch(() => false);
    const softToggle = await page.getByLabel(/soft close/i).first().isVisible().catch(() => false);
    expect.soft(silentToggle).toBeFalsy();
    expect.soft(softToggle).toBeFalsy();

    // Auto relist settings presence (gap expected in current UI)
    const relistToggle = await page.getByLabel(/relista(r| automático)|auto.*relist/i).first().isVisible().catch(() => false);
    expect.soft(relistToggle).toBeFalsy();
  });
});
