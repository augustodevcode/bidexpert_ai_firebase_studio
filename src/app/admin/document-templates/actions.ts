// src/app/admin/document-templates/actions.ts
'use server';

import type { DocumentTemplate, DocumentTemplateFormData } from '@bidexpert/core';
import { DocumentTemplateService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const documentTemplateService = new DocumentTemplateService();

const {
    obterTodos: getDocumentTemplates,
    obterPorId: getDocumentTemplate,
    criar: createDocumentTemplate,
    atualizar: updateDocumentTemplate,
    excluir: deleteDocumentTemplate
} = createCrudActions({
    service: documentTemplateService,
    entityName: 'Template de Documento',
    entityNamePlural: 'Templates de Documentos',
    routeBase: '/admin/document-templates'
});

export { getDocumentTemplates, getDocumentTemplate, createDocumentTemplate, updateDocumentTemplate, deleteDocumentTemplate };


// getDocumentTemplateAction is an alias for getDocumentTemplate, can be removed if not used elsewhere,
// but kept for now to avoid breaking potential external usages.
export async function getDocumentTemplateAction(id: string): Promise<DocumentTemplate | null> {
    return documentTemplateService.getDocumentTemplateById(id);
}
