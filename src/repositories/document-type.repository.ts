// src/repositories/document-type.repository.ts
import { prisma } from '@/lib/prisma';
import type { DocumentType } from '@/types';

export class DocumentTypeRepository {
  async findAll(): Promise<DocumentType[]> {
    // @ts-ignore
    return prisma.documentType.findMany({ orderBy: { name: 'asc' } });
  }
}
