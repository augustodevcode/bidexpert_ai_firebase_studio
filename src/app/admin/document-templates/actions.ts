// src/app/admin/document-templates/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { DocumentTemplate } from '@/types';
import type { DocumentTemplateFormData } from './document-template-form-schema';
import { DocumentTemplateService } from '@/services/document-template.service';

const documentTemplateService = new DocumentTemplateService();

export async function getDocumentTemplates(): Promise<DocumentTemplate[]> {
    return documentTemplateService.getDocumentTemplates();
}

export async function getDocumentTemplate(id: string): Promise<DocumentTemplate | null> {
    return documentTemplateService.getDocumentTemplateById(id);
}

export async function getDocumentTemplateAction(id: string): Promise<DocumentTemplate | null> {
    return getDocumentTemplate(id);
}

export async function createDocumentTemplate(data: DocumentTemplateFormData): Promise<{ success: boolean; message: string; templateId?: string; }> {
    const result = await documentTemplateService.createDocumentTemplate(data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/document-templates');
    }
    return result;
}

export async function updateDocumentTemplate(id: string, data: Partial<DocumentTemplateFormData>): Promise<{ success: boolean; message: string; }> {
    const result = await documentTemplateService.updateDocumentTemplate(id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/document-templates');
        revalidatePath(`/admin/document-templates/${id}/edit`);
    }
    return result;
}

export async function deleteDocumentTemplate(id: string): Promise<{ success: boolean; message: string; }> {
    const result = await documentTemplateService.deleteDocumentTemplate(id);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/document-templates');
    }
    return result;
}
