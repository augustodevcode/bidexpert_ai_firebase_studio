// src/services/document-template.service.ts
/**
 * @fileoverview Este arquivo contém a classe DocumentTemplateService, responsável
 * por gerenciar os templates de documentos (ex: Termo de Arrematação). Ele
 * encapsula a lógica de negócio para operações de CRUD nos templates, que
 * são usados pelo `generate-document-flow` para criar PDFs dinamicamente.
 */
import { DocumentTemplateRepository } from '@/repositories/document-template.repository';
import type { DocumentTemplate, DocumentTemplateFormData } from '@/types';
import type { Prisma } from '@prisma/client';

export class DocumentTemplateService {
  private repository: DocumentTemplateRepository;

  constructor() {
    this.repository = new DocumentTemplateRepository();
  }

  async getDocumentTemplates(): Promise<DocumentTemplate[]> {
    return this.repository.findAll();
  }

  async getDocumentTemplateById(id: string): Promise<DocumentTemplate | null> {
    return this.repository.findById(id);
  }

  async createDocumentTemplate(data: DocumentTemplateFormData): Promise<{ success: boolean; message: string; templateId?: string; }> {
    try {
      const newTemplate = await this.repository.create(data);
      return { success: true, message: "Template criado com sucesso.", templateId: newTemplate.id };
    } catch (error: any) {
      console.error("Error in DocumentTemplateService.create:", error);
      return { success: false, message: `Falha ao criar template: ${error.message}` };
    }
  }

  async updateDocumentTemplate(id: string, data: Partial<DocumentTemplateFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.update(id, data);
      return { success: true, message: 'Template atualizado com sucesso.' };
    } catch (error: any) {
      console.error(`Error in DocumentTemplateService.update for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar template: ${error.message}` };
    }
  }

  async deleteDocumentTemplate(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      // In a real app, you might check if the template is in use by generated documents.
      await this.repository.delete(id);
      return { success: true, message: 'Template excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in DocumentTemplateService.delete for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir template: ${error.message}` };
    }
  }
}
