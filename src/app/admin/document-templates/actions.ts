/**
 * @fileoverview Server Actions for managing Document Templates.
 * 
 * This file provides the server-side logic for creating, reading, updating,
 * and deleting document templates. These templates are used for generating
 * documents like winning bid terms, evaluation reports, etc., with dynamic data.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { DocumentTemplate, DocumentTemplateFormData } from '@/types';

/**
 * Creates a new document template.
 * @param {DocumentTemplateFormData} data - The template data from the form.
 * @returns {Promise<{ success: boolean; message: string; templateId?: string; }>} Result of the operation.
 */
export async function createDocumentTemplate(data: DocumentTemplateFormData): Promise<{ success: boolean; message: string; templateId?: string; }> {
  try {
    const newTemplate = await prisma.documentTemplate.create({
      data: {
        name: data.name,
        type: data.type,
        content: data.content,
      }
    });
    revalidatePath('/admin/document-templates');
    return { success: true, message: 'Template criado com sucesso!', templateId: newTemplate.id };
  } catch (error: any) {
    console.error("Error creating document template:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return { success: false, message: 'Já existe um template com este nome.' };
    }
    return { success: false, message: error.message || 'Falha ao criar template.' };
  }
}

/**
 * Fetches all document templates from the database.
 * @returns {Promise<DocumentTemplate[]>} An array of all templates.
 */
export async function getDocumentTemplates(): Promise<DocumentTemplate[]> {
  try {
    const templates = await prisma.documentTemplate.findMany({
      orderBy: { name: 'asc' }
    });
    return templates as unknown as DocumentTemplate[];
  } catch (error) {
    console.error("Error fetching document templates:", error);
    return [];
  }
}

/**
 * Fetches a single document template by its ID.
 * @param {string} id - The ID of the template.
 * @returns {Promise<DocumentTemplate | null>} The template object or null if not found.
 */
export async function getDocumentTemplate(id: string): Promise<DocumentTemplate | null> {
  try {
    const template = await prisma.documentTemplate.findUnique({ where: { id } });
    return template as unknown as DocumentTemplate | null;
  } catch (error) {
    console.error(`Error fetching template with ID ${id}:`, error);
    return null;
  }
}

/**
 * Updates an existing document template.
 * @param {string} id - The ID of the template to update.
 * @param {Partial<DocumentTemplateFormData>} data - The partial data to update.
 * @returns {Promise<{ success: boolean; message: string; }>} An object indicating the result.
 */
export async function updateDocumentTemplate(id: string, data: Partial<DocumentTemplateFormData>): Promise<{ success: boolean; message: string; }> {
  try {
    await prisma.documentTemplate.update({
      where: { id },
      data: data,
    });
    revalidatePath('/admin/document-templates');
    revalidatePath(`/admin/document-templates/${id}/edit`);
    return { success: true, message: 'Template atualizado com sucesso!' };
  } catch (error: any) {
    console.error(`Error updating template ${id}:`, error);
     if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return { success: false, message: 'Já existe um template com este nome.' };
    }
    return { success: false, message: error.message || 'Falha ao atualizar template.' };
  }
}

/**
 * Deletes a document template from the database.
 * @param {string} id - The ID of the template to delete.
 * @returns {Promise<{ success: boolean; message: string; }>} An object indicating the result.
 */
export async function deleteDocumentTemplate(id: string): Promise<{ success: boolean; message: string; }> {
  try {
    await prisma.documentTemplate.delete({ where: { id } });
    revalidatePath('/admin/document-templates');
    return { success: true, message: 'Template excluído com sucesso!' };
  } catch (error: any) {
    console.error(`Error deleting template ${id}:`, error);
    return { success: false, message: error.message || 'Falha ao excluir template.' };
  }
}
