// packages/core/src/repositories/document-template.repository.ts
import { prisma } from '../lib/prisma';
import type { DocumentTemplate } from '../types';
import type { Prisma } from '@prisma/client';

export class DocumentTemplateRepository {
  async findAll(): Promise<DocumentTemplate[]> {
    return prisma.documentTemplate.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<DocumentTemplate | null> {
    return prisma.documentTemplate.findUnique({ where: { id } });
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
}
