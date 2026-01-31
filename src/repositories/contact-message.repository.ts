// src/repositories/contact-message.repository.ts
/**
 * @fileoverview Repositório de mensagens de contato.
 * Centraliza acesso ao Prisma para consultas e mutações.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export class ContactMessageRepository {
  async findAll() {
    return prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: bigint) {
    return prisma.contactMessage.findUnique({ where: { id } });
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
