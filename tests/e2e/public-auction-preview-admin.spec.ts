/**
 * @fileoverview Valida o preview autenticado de leiloes nao publicados a partir do admin.
 */

import { PrismaClient } from '@prisma/client';
import { expect, test } from '@playwright/test';

const prisma = new PrismaClient();

type PreviewAuctionFixture = {
  id: string;
  publicId: string;
  title: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function createPreviewAuctionFixture(): Promise<PreviewAuctionFixture> {
  const sourceTenant = await prisma.tenant.findFirst({
    where: { subdomain: 'demo' },
    select: {
      id: true,
    },
  });

  if (!sourceTenant?.id) {
    throw new Error('Nenhum tenant foi encontrado para criar o fixture de preview.');
  }

  const suffix = Date.now();
  const title = `Leilao Preview Admin ${suffix}`;
  const publicId = `AUC-PREVIEW-${suffix}`;
  const slug = `auc-preview-${suffix}`;

  const createdAuction = await prisma.auction.create({
    data: {
      publicId,
      slug,
      title,
      description: 'Fixture automatizado para validar preview autenticado de leiloes nao publicados.',
      status: 'RASCUNHO',
      tenantId: sourceTenant.id,
      auctionDate: new Date(Date.now() + 86_400_000),
      endDate: new Date(Date.now() + 172_800_000),
      totalLots: 0,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      publicId: true,
      title: true,
    },
  });

  return {
    id: createdAuction.id.toString(),
    publicId: createdAuction.publicId ?? publicId,
    title: createdAuction.title,
  };
}

async function deletePreviewAuctionFixture(id: string): Promise<void> {
  await prisma.auction.delete({ where: { id: BigInt(id) } }).catch(() => undefined);
}

test.describe('preview autenticado do leilao publico', () => {
  test.use({ storageState: './tests/e2e/.auth/admin.json' });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('admin autenticado consegue abrir a rota publica de um leilao em rascunho', async ({ page }) => {
    const fixture = await createPreviewAuctionFixture();

    try {
      await page.goto(`/auctions/${fixture.publicId}`, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(`/auctions/${escapeRegExp(fixture.publicId)}$`));
      await expect(page.locator('body')).not.toContainText(/Leil[aã]o N[aã]o Encontrado/i);
      await page.screenshot({
        path: 'tests/e2e/screenshots/public-auction-preview-admin.png',
        fullPage: true,
      });
    } finally {
      await deletePreviewAuctionFixture(fixture.id);
    }
  });
});