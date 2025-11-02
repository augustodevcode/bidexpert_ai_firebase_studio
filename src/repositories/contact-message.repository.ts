// src/repositories/contact-message.repository.ts
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export class ContactMessageRepository {
  async findAll() {
    return prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(data: Prisma.ContactMessageCreateInput) {
    return prisma.contactMessage.create({ data });
  }

  async update(id: bigint, data: Prisma.ContactMessageUpdateInput) {
    return prisma.contactMessage.update({ where: { id }, data });
  }

  async delete(id: bigint) {
    return prisma.contactMessage.delete({ where: { id } });
  }
  
  async deleteAll() {
    return prisma.contactMessage.deleteMany({});
  }
}
