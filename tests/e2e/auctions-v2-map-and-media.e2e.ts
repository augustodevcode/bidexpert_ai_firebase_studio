/**
 * @fileoverview E2E (BDD/TDD): valida mapa e vínculo de mídia na página de edição de leilão V2.
 */
import { expect, test } from '@playwright/test';

const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:9002';
const auctionId = process.env.E2E_AUCTION_ID || 'AUC-ZGDGG576';

// Requer sessão autenticada no ambiente alvo.
test.describe('Auctions V2 - mapa e mídia', () => {
  test.skip(!process.env.E2E_RUN_AUCTIONS, 'Defina E2E_RUN_AUCTIONS=1 e autentique a sessão antes de rodar este teste.');

  test('exibe o mapa focado e o botão da biblioteca', async ({ page }) => {
    await page.goto(`${baseUrl}/admin/auctions-v2/${auctionId}`, { waitUntil: 'networkidle' });

    const mediaButton = page.getByTestId('auction-media-library-button');
    await expect(mediaButton).toBeVisible();

    const map = page.getByTestId('auction-location-map');
    await expect(map).toBeVisible();
    const hasCoordinates = await map.getAttribute('data-has-coordinates');
    expect(hasCoordinates).not.toBeNull();
  });
});
