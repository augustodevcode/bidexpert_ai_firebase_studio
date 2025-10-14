// src/repositories/media.repository.ts
import { prisma } from '@/lib/prisma';
import type { MediaItem } from '@/types';
import type { Prisma } from '@prisma/client';

export class MediaRepository {
  async findAll(): Promise<MediaItem[]> {
    // @ts-ignore
    return prisma.mediaItem.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string): Promise<MediaItem | null> {
    // @ts-ignore
    return prisma.mediaItem.findUnique({ where: { id } });
  }

  async create(data: Prisma.MediaItemCreateInput): Promise<MediaItem> {
    // @ts-ignore
    return prisma.mediaItem.create({ data });
  }

  async update(id: string, data: Prisma.MediaItemUpdateInput): Promise<MediaItem> {
    // @ts-ignore
    return prisma.mediaItem.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.mediaItem.delete({ where: { id } });
  }

  async deleteAll(): Promise<void> {
    await prisma.mediaItem.deleteMany({});
  }
}
