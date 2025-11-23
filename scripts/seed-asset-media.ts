import { faker } from '@faker-js/faker';
import { MediaItemService } from '../src/services/media-item.service';
import { prisma } from '../src/lib/prisma';
import type { Asset, MediaItem } from '../src/types';

export async function seedMediaItems(
  mediaItemService: MediaItemService,
  userId: string | undefined,
  count = 50
): Promise<MediaItem[]> {
  if (!userId) return [];

  const createdItems: MediaItem[] = [];
  for (let i = 0; i < count; i++) {
    const result = await mediaItemService.createMediaItem({
      userId,
      fileName: `asset-image-${Date.now()}-${i}.jpg`,
      storagePath: `images/asset-image-${i}.jpg`,
      sizeBytes: faker.number.int({ min: 150000, max: 3000000 }),
      urlOriginal: `https://picsum.photos/seed/asset-${i}-${Date.now()}/1200/900`,
      mimeType: 'image/jpeg',
    });

    if (result.success && result.mediaItem) {
      createdItems.push(result.mediaItem);
    }
  }

  return createdItems;
}

export async function attachMediaGalleryToAssets(
  assets: Asset[],
  mediaItems: MediaItem[],
  maxItemsPerAsset = 3
): Promise<number> {
  if (!assets.length || !mediaItems.length) return 0;

  let createdCount = 0;

  for (const asset of assets) {
    if (!asset?.id) continue;
    const existingEntries = await prisma.assetMedia.count({ where: { assetId: BigInt(asset.id) } });
    if (existingEntries > 0) continue;

    const selection = faker.helpers.arrayElements(mediaItems, {
      min: 1,
      max: Math.min(maxItemsPerAsset, mediaItems.length),
    });

    if (!selection.length) continue;

    for (let index = 0; index < selection.length; index++) {
      const media = selection[index];
      await prisma.assetMedia.create({
        data: {
          asset: { connect: { id: BigInt(asset.id) } },
          mediaItem: { connect: { id: BigInt(media.id) } },
          isPrimary: index === 0,
          displayOrder: index,
        },
      });

      createdCount++;

      if (index === 0) {
        await prisma.asset.update({
          where: { id: BigInt(asset.id) },
          data: {
            imageMediaId: BigInt(media.id),
            imageUrl: media.urlOriginal,
          },
        });
      }
    }
  }

  return createdCount;
}
