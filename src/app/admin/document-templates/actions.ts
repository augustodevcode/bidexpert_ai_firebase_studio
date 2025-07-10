// src/app/admin/document-templates/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database/index';
import type { DocumentTemplate } from '@/types';

// Placeholder for a form data type
interface DocumentTemplateFormData {
  name: string;
  type: string;
  content: string;
}

export async function getDocumentTemplates(): Promise<DocumentTemplate[]> {
    const db = await getDatabaseAdapter();
    // @ts-ignore - Assuming this method exists on the adapter for now
    if (db.getDocumentTemplates) {
        // @ts-ignore
        return db.getDocumentTemplates();
    }
    return [];
}

export async function getDocumentTemplate(id: string): Promise<DocumentTemplate | null> {
    const templates = await getDocumentTemplates();
    return templates.find(t => t.id === id) || null;
}

export async function createDocumentTemplate(data: DocumentTemplateFormData): Promise<{ success: boolean; message: string; templateId?: string; }> {
     console.warn("createDocumentTemplate with sample data adapter is not fully implemented.");
    return { success: false, message: "Criação de template não implementada." };
}

export async function updateDocumentTemplate(id: string, data: Partial<DocumentTemplateFormData>): Promise<{ success: boolean; message: string; }> {
     console.warn("updateDocumentTemplate with sample data adapter is not fully implemented.");
    return { success: false, message: "Atualização de template não implementada." };
}

export async function deleteDocumentTemplate(id: string): Promise<{ success: boolean; message: string; }> {
     console.warn("deleteDocumentTemplate with sample data adapter is not fully implemented.");
    return { success: false, message: "Exclusão de template não implementada." };
}
