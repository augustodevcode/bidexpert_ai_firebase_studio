// src/services/document-type.service.ts
import { DocumentTypeRepository } from '@/repositories/document-type.repository';
import type { DocumentType } from '@prisma/client';

export class DocumentTypeService {
  private repository: DocumentTypeRepository;

  constructor() {
    this.repository = new DocumentTypeRepository();
  }

  async upsertDocumentType(data: { name: string; description: string; isRequired: boolean; appliesTo: 'PHYSICAL' | 'LEGAL' | 'BOTH' }): Promise<DocumentType> {
    return this.repository.upsert(data);
  }

  async findByName(name: string): Promise<DocumentType | null> {
    return this.repository.findByName(name);
  }

  async findById(id: bigint): Promise<DocumentType | null> {
    return this.repository.findById(id);
  }
}
