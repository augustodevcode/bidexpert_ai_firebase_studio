// tests/document-template.test.ts
import { describe, test, beforeAll, afterAll, expect, it } from 'vitest';
import assert from 'node:assert';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { DocumentTemplateService } from '@/services/document-template.service';
import type { DocumentTemplateFormData } from '@/app/admin/document-templates/document-template-form-schema';

const templateService = new DocumentTemplateService();
const testRunId = `doc-tpl-e2e-${uuidv4().substring(0, 8)}`;
const testTemplateName = `Template de Teste ${testRunId}`;
let createdTemplateId: string | undefined;

describe('Document Template Service E2E Tests', () => {

    afterAll(async () => {
        try {
            if (createdTemplateId) await templateService.deleteDocumentTemplate(createdTemplateId);
        } catch (error) {
            console.error(`[DocTemplate TEST CLEANUP] - Failed to delete records for run ${testRunId}:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new document template and verify it', async () => {
        // Arrange
        const newTemplateData: DocumentTemplateFormData = {
            name: testTemplateName,
            type: 'WINNING_BID_TERM',
            content: '<h1>Termo de Arrematação</h1><p>Lote: {{{lote.titulo}}}</p>'
        };

        // Act
        const result = await templateService.createDocumentTemplate(newTemplateData);
        createdTemplateId = result.templateId;

        // Assert
        assert.ok(result.success, 'createDocumentTemplate should succeed');
        assert.ok(result.templateId, 'A new templateId should be returned');

        const createdTemplate = await prisma.documentTemplate.findUnique({ where: { id: result.templateId } });
        assert.ok(createdTemplate, 'Created template should be found in DB');
        assert.strictEqual(createdTemplate.name, newTemplateData.name);
        assert.strictEqual(createdTemplate.type, 'WINNING_BID_TERM');
        assert.strictEqual(createdTemplate.content, newTemplateData.content);
    });
});
