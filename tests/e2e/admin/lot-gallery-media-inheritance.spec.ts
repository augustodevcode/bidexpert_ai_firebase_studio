import { test, expect } from '@playwright/test';
import { BASE_URL, ensureAdminSession, saveForm, assertToastOrSuccess } from './admin-helpers';

const TARGET_LOT_PUBLIC_ID = process.env.LOT_GALLERY_TARGET_LOT_ID || 'LOTE-0028';
const LOCAL_GALLERY_IMAGE_URL = 'https://placehold.co/800x600/png?text=BidExpert+Gallery';

type LocalFixtureRestoreState = {
  lotId: bigint;
  imageUrl: string | null;
  imageMediaId: bigint | null;
  galleryImageUrls: unknown;
  mediaItemIds: unknown;
  updatedAt: Date;
  createdMediaId?: bigint;
};

function isLocalBaseUrl() {
  const hostname = new URL(BASE_URL).hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost');
}

async function ensureGalleryFixtureLot(): Promise<{ lotPublicId: string; restoreState?: LocalFixtureRestoreState } | null> {
  if (!isLocalBaseUrl()) {
    return { lotPublicId: TARGET_LOT_PUBLIC_ID };
  }

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const targetLot = await prisma.lot.findFirst({
      where: { tenantId: BigInt(1), publicId: TARGET_LOT_PUBLIC_ID },
      select: { id: true, publicId: true, tenantId: true },
    });
    const fallbackLot = targetLot ?? await prisma.lot.findFirst({
      where: { tenantId: BigInt(1), price: { gt: 0 } },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        publicId: true,
        tenantId: true,
        imageUrl: true,
        imageMediaId: true,
        galleryImageUrls: true,
        mediaItemIds: true,
        updatedAt: true,
      },
    });

    if (!fallbackLot) {
      return null;
    }

    const existingMedia = await prisma.mediaItem.findFirst({
      where: { tenantId: fallbackLot.tenantId, storagePath: 'e2e/lot-gallery-media.png' },
      select: { id: true },
    });
    const media = existingMedia ?? await prisma.mediaItem.create({
      data: {
        fileName: 'lot-gallery-media.png',
        storagePath: 'e2e/lot-gallery-media.png',
        urlOriginal: LOCAL_GALLERY_IMAGE_URL,
        urlThumbnail: LOCAL_GALLERY_IMAGE_URL,
        mimeType: 'image/png',
        sizeBytes: 1,
        title: 'E2E lot gallery media',
        tenantId: fallbackLot.tenantId,
      },
      select: { id: true },
    });
    const createdMediaId = existingMedia ? undefined : media.id;

    await prisma.lot.update({
      where: { id: fallbackLot.id },
      data: {
        imageUrl: LOCAL_GALLERY_IMAGE_URL,
        imageMediaId: media.id,
        galleryImageUrls: [LOCAL_GALLERY_IMAGE_URL],
        mediaItemIds: [media.id.toString()],
        updatedAt: new Date(),
      },
    });

    return {
      lotPublicId: fallbackLot.publicId ?? fallbackLot.id.toString(),
      restoreState: {
        lotId: fallbackLot.id,
        imageUrl: fallbackLot.imageUrl,
        imageMediaId: fallbackLot.imageMediaId,
        galleryImageUrls: fallbackLot.galleryImageUrls,
        mediaItemIds: fallbackLot.mediaItemIds,
        updatedAt: fallbackLot.updatedAt,
        createdMediaId,
      },
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function restoreGalleryFixtureLot(restoreState?: LocalFixtureRestoreState) {
  if (!restoreState) return;

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    await prisma.lot.update({
      where: { id: restoreState.lotId },
      data: {
        imageUrl: restoreState.imageUrl,
        imageMediaId: restoreState.imageMediaId,
        galleryImageUrls: restoreState.galleryImageUrls as any,
        mediaItemIds: restoreState.mediaItemIds as any,
        updatedAt: restoreState.updatedAt,
      },
    });

    if (restoreState.createdMediaId) {
      await prisma.mediaItem.delete({ where: { id: restoreState.createdMediaId } }).catch(() => undefined);
    }
  } finally {
    await prisma.$disconnect();
  }
}

test.describe('Admin lot gallery media inheritance', () => {
  test('keeps LOTE-0028 gallery thumbnails sized and submits media state without client validation errors', async ({ page }, testInfo) => {
    const fixture = await ensureGalleryFixtureLot();
    test.skip(!fixture, 'Nenhum lote local disponível para validar galeria de mídia');

    try {
      await ensureAdminSession(page);
      await page.goto(`${BASE_URL}/admin/lots/${fixture.lotPublicId}/edit`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
      await testInfo.attach('lot-public-id', { body: fixture.lotPublicId, contentType: 'text/plain' });

      const form = page.locator('[data-ai-id="lot-form"]');
      await expect(form).toBeVisible({ timeout: 60_000 });

      const galleryImages = form.locator('img[alt^="Imagem da galeria"]');
      const galleryCount = await galleryImages.count();
      test.skip(galleryCount === 0, 'LOTE-0028 sem imagens de galeria no seed local');

      await expect(galleryImages.first()).toHaveAttribute('sizes', /12vw/);
      await testInfo.attach('gallery-sizes-attribute', {
        body: await galleryImages.first().getAttribute('sizes') ?? '',
        contentType: 'text/plain',
      });

      await saveForm(page, { timeout: 45_000 });
      await assertToastOrSuccess(page);

      const clientValidationText = await page.locator('[role="alert"]').allTextContents();
      expect(clientValidationText.join(' ')).not.toMatch(/imageMediaId|bigint|Expected string/i);
    } finally {
      await restoreGalleryFixtureLot(fixture?.restoreState);
    }
  });
});