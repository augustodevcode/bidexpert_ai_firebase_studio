// packages/core/src/repositories/document-type.repository.ts
import { prisma } from '../lib/prisma';
import type { DocumentType } from '@bidexpert/core';

export class DocumentTypeRepository {
  async findAll(): Promise<DocumentType[]> {
    // @ts-ignore
    return prisma.documentType.findMany({ orderBy: { name: 'asc' } });
  }
}
