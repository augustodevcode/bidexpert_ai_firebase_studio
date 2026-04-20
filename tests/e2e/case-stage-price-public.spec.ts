/**
 * @fileoverview Valida a consistência pública do preço por praça no lote CASE.
 */

import { PrismaClient } from '@prisma/client';
import { config as loadEnv } from 'dotenv';
import { test, expect } from './fixtures/browser-telemetry.fixture';
import { loginAsAdmin } from './helpers/auth-helper';

loadEnv({ path: '.env.local' });

const prisma = new PrismaClient();

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9005';
const CASE_AUCTION_TITLE = 'Terraplenagem Sao Sebastiao Ltda ME - Tomada de Precos';
const CASE_LOT_TITLE = 'MOTONIVELADORA CASE 845B ANO: 2024';

async function resolveCaseLotPath() {
  const lot = await prisma.lot.findFirstOrThrow({
    where: {
      title: { contains: CASE_LOT_TITLE },
      Auction: {
        is: {
          title: { contains: CASE_AUCTION_TITLE },
        },
      },
    },
    orderBy: { id: 'desc' },
    select: { id: true, publicId: true, slug: true, auctionId: true },
  });

  return `/auctions/${lot.auctionId.toString()}/lots/${lot.publicId ?? lot.slug ?? lot.id.toString()}`;
}

test.describe('CASE stage price on public lot detail', () => {
  test.setTimeout(120_000);

  test('uses the active stage price and increment in the bidding panel', async ({ page }) => {
    const lotPath = await resolveCaseLotPath();

    await loginAsAdmin(page, BASE_URL);
    await page.goto(`${BASE_URL}${lotPath}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    await expect(page.getByRole('heading', { name: new RegExp(CASE_LOT_TITLE, 'i') })).toBeVisible({ timeout: 60_000 });

    await expect(page.getByText(/Lance mínimo agora\s*R\$\s*900\.000,00/i)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/Lance Inicial \(Prazo de Proposta.*\):\s*R\$\s*900\.000/i)).toBeVisible({ timeout: 60_000 });

    await expect(page.getByRole('button', { name: /Dar Lance \(R\$ 900\.000,00\)/i })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: /^\+R\$ 5\.000(?:,00)?$/i })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: /^\+R\$ 10\.000(?:,00)?$/i })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: /^\+R\$ 25\.000(?:,00)?$/i })).toBeVisible({ timeout: 60_000 });

    await expect(page.getByRole('button', { name: /^\+R\$ 100(?:,00)?$/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^\+R\$ 200(?:,00)?$/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^\+R\$ 500(?:,00)?$/i })).toHaveCount(0);
  });
});