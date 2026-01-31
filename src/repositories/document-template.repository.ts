// src/repositories/document-template.repository.ts
import { prisma } from '@/lib/prisma';
import type { DocumentTemplate } from '@/types';
import type { Prisma } from '@prisma/client';

export class DocumentTemplateRepository {
  constructor() {
    // Usando a instância global do prisma
  }

  async findAll(): Promise<DocumentTemplate[]> {
    return prisma.documentTemplate.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<DocumentTemplate | null> {
    return prisma.documentTemplate.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<DocumentTemplate | null> {
    return prisma.documentTemplate.findUnique({ where: { name } });
  }

  async create(data: Prisma.DocumentTemplateCreateInput): Promise<DocumentTemplate> {
    return prisma.documentTemplate.create({ data });
  }

  async update(id: string, data: Prisma.DocumentTemplateUpdateInput): Promise<DocumentTemplate> {
    return prisma.documentTemplate.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.documentTemplate.delete({ where: { id } });
  }

  async deleteAll(): Promise<void> {
    await prisma.documentTemplate.deleteMany({});
  }
}
