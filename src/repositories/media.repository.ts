// src/repositories/media.repository.ts
import { prisma } from '@/lib/prisma';
import type { MediaItem } from '@/types';
import type { Prisma } from '@prisma/client';

export class MediaRepository {
  async findAll(): Promise<MediaItem[]> {
    const items = await prisma.mediaItem.findMany({ orderBy: { uploadedAt: 'desc' } });
    return items.map(this.serializeItem);
  }

  async findById(id: string): Promise<MediaItem | null> {
    const item = await prisma.mediaItem.findUnique({ where: { id: BigInt(id) } });
    return item ? this.serializeItem(item) : null;
  }

  async create(data: Prisma.MediaItemCreateInput): Promise<MediaItem> {
    const item = await prisma.mediaItem.create({ data });
    return this.serializeItem(item);
  }

  async update(id: string, data: Prisma.MediaItemUpdateInput): Promise<MediaItem> {
    const item = await prisma.mediaItem.update({ where: { id: BigInt(id) }, data });
    return this.serializeItem(item);
  }

  async delete(id: string): Promise<void> {
    await prisma.mediaItem.delete({ where: { id: BigInt(id) } });
  }

  async deleteAll(): Promise<void> {
    await prisma.mediaItem.deleteMany({});
  }

  private serializeItem(item: any): MediaItem {
    return {
      ...item,
      id: String(item.id),
      uploadedByUserId: item.uploadedByUserId ? String(item.uploadedByUserId) : null,
      judicialProcessId: item.judicialProcessId ? String(item.judicialProcessId) : null,
      tenantId: item.tenantId ? String(item.tenantId) : null,
    };
  }
}
