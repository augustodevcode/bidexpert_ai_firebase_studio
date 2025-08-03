// src/repositories/contact-message.repository.ts
import { prisma } from '@/lib/prisma';
import type { ContactMessage } from '@/types';
import type { Prisma } from '@prisma/client';

export class ContactMessageRepository {
  async findAll(): Promise<ContactMessage[]> {
    return prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(data: Prisma.ContactMessageCreateInput): Promise<ContactMessage> {
    return prisma.contactMessage.create({ data });
  }

  async update(id: string, data: Prisma.ContactMessageUpdateInput): Promise<ContactMessage> {
    return prisma.contactMessage.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.contactMessage.delete({ where: { id } });
  }
}
