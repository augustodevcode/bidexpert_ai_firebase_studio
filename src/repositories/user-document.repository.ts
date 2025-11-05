import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export class UserDocumentRepository {
  async create(data: Prisma.UserDocumentCreateInput) {
    return prisma.userDocument.create({ data });
  }

  async findById(id: bigint) {
    return prisma.userDocument.findUnique({ where: { id } });
  }

  async findMany(args?: Prisma.UserDocumentFindManyArgs) {
    return prisma.userDocument.findMany(args);
  }

  async update(id: bigint, data: Prisma.UserDocumentUpdateInput) {
    return prisma.userDocument.update({ where: { id }, data });
  }

  async delete(id: bigint) {
    return prisma.userDocument.delete({ where: { id } });
  }
}