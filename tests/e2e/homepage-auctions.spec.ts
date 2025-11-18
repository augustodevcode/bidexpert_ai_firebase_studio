import { test, expect } from '@playwright/test';

// Verifica se os cards de leilão exibem as praças (stages) na home
// Usa o data-ai-id inserido no componente AuctionCard para localizar os badges renderizados

test.describe('Home Page Auctions', () => {
  test('exibe badges com as praças do leilão', async ({ page }) => {
    await page.goto('/');

    const stagesLocator = page.locator('[data-ai-id="auction-card-stages"]').first();

    await stagesLocator.waitFor({ state: 'visible' });

    await expect(stagesLocator).toBeVisible();
    await expect(stagesLocator).toContainText('Praça');
  });
});
