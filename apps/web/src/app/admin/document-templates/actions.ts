// src/app/admin/document-templates/actions.ts
'use server';

import type { DocumentTemplate, DocumentTemplateFormData } from '@bidexpert/core';
import { DocumentTemplateService } from '@bidexpert/core';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const documentTemplateService = new DocumentTemplateService();

const documentTemplateActions = createCrudActions({
    service: documentTemplateService,
    entityName: 'DocumentTemplate',
    entityNamePlural: 'DocumentTemplates',
    routeBase: '/admin/document-templates'
});

export const {
    getAll: getDocumentTemplates,
    getById: getDocumentTemplate,
    create: createDocumentTemplate,
    update: updateDocumentTemplate,
    delete: deleteDocumentTemplate
} = documentTemplateActions;

// getDocumentTemplateAction is an alias for getDocumentTemplate, can be removed if not used elsewhere,
// but kept for now to avoid breaking potential external usages.
export async function getDocumentTemplateAction(id: string): Promise<DocumentTemplate | null> {
    return documentTemplateService.getDocumentTemplateById(id);
}
