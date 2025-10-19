// src/repositories/document-type.repository.ts
import { prisma } from '@/lib/prisma';
import type { Prisma, DocumentType } from '@prisma/client';

export class DocumentTypeRepository {
  async findByName(name: string): Promise<DocumentType | null> {
    return prisma.documentType.findUnique({
      where: { name },
    });
  }

  async findById(id: BigInt): Promise<DocumentType | null> {
    return prisma.documentType.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.DocumentTypeCreateInput): Promise<DocumentType> {
    return prisma.documentType.create({ data });
  }

  async upsert(data: Prisma.DocumentTypeCreateInput): Promise<DocumentType> {
    return prisma.documentType.upsert({
      where: { name: data.name },
      update: data,
      create: data,
    });
  }
}
