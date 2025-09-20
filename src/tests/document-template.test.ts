// tests/document-template.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { createDocumentTemplate, deleteDocumentTemplate } from '@/app/admin/document-templates/actions';
import type { DocumentTemplateFormData } from '@/app/admin/document-templates/document-template-form-schema';
import { callActionAsUser } from './test-utils';
import { createUser, getUserProfileData } from '@/app/admin/users/actions';
import type { Tenant } from '@/types';

const testRunId = `doc-tpl-e2e-action-${uuidv4().substring(0, 8)}`;
const testTemplateName = `Template de Teste ${testRunId}`;
let createdTemplateId: string | undefined;
let testTenant: Tenant;
let adminUser: any;

describe('Document Template Actions E2E Tests', () => {

    beforeAll(async () => {
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `doc-tpl-${testRunId}` } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        
        const adminRes = await createUser({
            fullName: `Admin DocTpl Test ${testRunId}`,
            email: `admin-doctpl-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user");
        adminUser = await getUserProfileData(adminRes.userId);
    });

    afterAll(async () => {
        try {
            if (createdTemplateId) await callActionAsUser(deleteDocumentTemplate, adminUser, createdTemplateId);
            if (adminUser) await prisma.user.delete({ where: { id: adminUser.id }});
            if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
            console.error(`[DocTemplate TEST CLEANUP] - Failed to delete records for run ${testRunId}:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new document template via action and verify it', async () => {
        // Arrange
        const newTemplateData: DocumentTemplateFormData = {
            name: testTemplateName,
            type: 'WINNING_BID_TERM',
            content: '<h1>Termo de Arrematação</h1><p>Lote: {{{lote.titulo}}}</p>'
        };

        // Act
        const result = await callActionAsUser(createDocumentTemplate, adminUser, newTemplateData);
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
