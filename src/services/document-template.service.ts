// src/services/document-template.service.ts
/**
 * @fileoverview Este arquivo contém a classe DocumentTemplateService, responsável
 * por gerenciar os templates de documentos (ex: Termo de Arrematação). Ele
 * encapsula a lógica de negócio para operações de CRUD nos templates, que
 * são usados pelo `generate-document-flow` para criar PDFs dinamicamente.
 */
import { DocumentTemplateRepository } from '@/repositories/document-template.repository';
import type { DocumentTemplate, DocumentTemplateFormData } from '@/types';
import type { Prisma, PrismaClient } from '@prisma/client';

export class DocumentTemplateService {
  private repository: DocumentTemplateRepository;

  constructor(prismaClient: PrismaClient) {
    this.repository = new DocumentTemplateRepository(prismaClient);
  }

  async getDocumentTemplates(): Promise<DocumentTemplate[]> {
    return this.repository.findAll();
  }

  async getDocumentTemplateById(id: string): Promise<DocumentTemplate | null> {
    return this.repository.findById(id);
  }

  async createDocumentTemplate(data: DocumentTemplateFormData): Promise<{ success: boolean; message: string; templateId?: string; }> {
    try {
      const existingTemplate = await this.repository.findByName(data.name);
      let newTemplate;
      if (existingTemplate) {
        newTemplate = await this.repository.update(existingTemplate.id, data);
      } else {
        newTemplate = await this.repository.create(data);
      }
      return { success: true, message: "Template criado/atualizado com sucesso.", templateId: newTemplate.id };
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

  async deleteAllDocumentTemplates(): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.deleteAll();
      return { success: true, message: 'Todos os templates de documento foram excluídos.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todos os templates de documento.' };
    }
  }
}
