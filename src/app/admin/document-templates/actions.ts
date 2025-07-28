
// src/app/admin/document-templates/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { DocumentTemplate } from '@/types';
import type { DocumentTemplateFormData } from './document-template-form-schema';
import { revalidatePath } from 'next/cache';

export async function getDocumentTemplates(): Promise<DocumentTemplate[]> {
    return prisma.documentTemplate.findMany({ orderBy: { name: 'asc' } });
}

export async function getDocumentTemplate(id: string): Promise<DocumentTemplate | null> {
    return prisma.documentTemplate.findUnique({ where: { id } });
}

export async function getDocumentTemplateAction(id: string): Promise<DocumentTemplate | null> {
    return getDocumentTemplate(id);
}


export async function createDocumentTemplate(data: DocumentTemplateFormData): Promise<{ success: boolean; message: string; templateId?: string; }> {
    try {
        const newTemplate = await prisma.documentTemplate.create({ data });
        revalidatePath('/admin/document-templates');
        return { success: true, message: "Template criado com sucesso.", templateId: newTemplate.id };
    } catch (error: any) {
        return { success: false, message: `Falha ao criar template: ${error.message}` };
    }
}

export async function updateDocumentTemplate(id: string, data: Partial<DocumentTemplateFormData>): Promise<{ success: boolean; message: string; }> {
    try {
        await prisma.documentTemplate.update({ where: { id }, data });
        revalidatePath('/admin/document-templates');
        revalidatePath(`/admin/document-templates/${id}/edit`);
        return { success: true, message: "Template atualizado com sucesso." };
    } catch (error: any) {
        return { success: false, message: `Falha ao atualizar template: ${error.message}` };
    }
}

export async function deleteDocumentTemplate(id: string): Promise<{ success: boolean; message: string; }> {
    try {
        await prisma.documentTemplate.delete({ where: { id } });
        revalidatePath('/admin/document-templates');
        return { success: true, message: "Template excluído com sucesso." };
    } catch (error: any) {
        return { success: false, message: `Falha ao excluir template: ${error.message}` };
    }
}
