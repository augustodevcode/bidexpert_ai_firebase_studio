import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export class MediaItemRepository {
  async create(data: Prisma.MediaItemCreateInput) {
    return prisma.mediaItem.create({ data });
  }

  async findById(id: bigint) {
    return prisma.mediaItem.findUnique({ where: { id } });
  }

  async findMany(args?: Prisma.MediaItemFindManyArgs) {
    return prisma.mediaItem.findMany(args);
  }

  async update(id: bigint, data: Prisma.MediaItemUpdateInput) {
    return prisma.mediaItem.update({ where: { id }, data });
  }

  async delete(id: bigint) {
    return prisma.mediaItem.delete({ where: { id } });
  }
}