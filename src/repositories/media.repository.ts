/**
 * @fileoverview Repository de acesso ao banco para MediaItem.
 * Usa BigInt para ids conforme definido no schema Prisma.
 */
import { prisma } from '@/lib/prisma';
import type { MediaItem } from '@/types';
import type { Prisma } from '@prisma/client';

export class MediaRepository {
  async findAll(): Promise<MediaItem[]> {
    return prisma.mediaItem.findMany({
      orderBy: { uploadedAt: 'desc' },
    }) as unknown as Promise<MediaItem[]>;
  }

  async findById(id: string): Promise<MediaItem | null> {
    return prisma.mediaItem.findUnique({
      where: { id: BigInt(id) },
    }) as unknown as Promise<MediaItem | null>;
  }

  async create(data: Prisma.MediaItemCreateInput): Promise<MediaItem> {
    return prisma.mediaItem.create({ data }) as unknown as Promise<MediaItem>;
  }

  async update(id: string, data: Prisma.MediaItemUpdateInput): Promise<MediaItem> {
    return prisma.mediaItem.update({
      where: { id: BigInt(id) },
      data,
    }) as unknown as Promise<MediaItem>;
  }

  async delete(id: string): Promise<void> {
    await prisma.mediaItem.delete({ where: { id: BigInt(id) } });
  }

  async deleteAll(): Promise<void> {
    await prisma.mediaItem.deleteMany({});
  }
}
