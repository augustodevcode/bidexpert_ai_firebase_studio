// packages/core/src/services/document-type.service.ts
import { DocumentTypeRepository } from '../repositories/document-type.repository';
import type { DocumentType } from '../types';

export class DocumentTypeService {
  private repository: DocumentTypeRepository;

  constructor() {
    this.repository = new DocumentTypeRepository();
  }

  async getDocumentTypes(): Promise<DocumentType[]> {
    return this.repository.findAll();
  }
}
