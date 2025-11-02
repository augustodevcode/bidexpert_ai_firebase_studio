// src/repositories/document-template.repository.ts
import type { DocumentTemplate } from '@/types';
import type { Prisma, PrismaClient } from '@prisma/client';

export class DocumentTemplateRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async findAll(): Promise<DocumentTemplate[]> {
    return this.prisma.documentTemplate.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<DocumentTemplate | null> {
    return this.prisma.documentTemplate.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<DocumentTemplate | null> {
    return this.prisma.documentTemplate.findUnique({ where: { name } });
  }

  async create(data: Prisma.DocumentTemplateCreateInput): Promise<DocumentTemplate> {
    return this.prisma.documentTemplate.create({ data });
  }

  async update(id: string, data: Prisma.DocumentTemplateUpdateInput): Promise<DocumentTemplate> {
    return this.prisma.documentTemplate.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.documentTemplate.delete({ where: { id } });
  }

  async deleteAll(): Promise<void> {
    await this.prisma.documentTemplate.deleteMany({});
  }
}
