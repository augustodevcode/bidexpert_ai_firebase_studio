// tests/role.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { createRole } from '../src/app/admin/roles/actions';
import { prisma } from '../src/lib/prisma';
import type { RoleFormData, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';

// Mock server-only para permitir testes de server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createUser, getUserProfileData } from '@/app/admin/users/actions';


const testRunId = `role-e2e-action-${uuidv4().substring(0, 8)}`;
const testRoleName = `Perfil de Teste ${testRunId}`;
let testTenant: Tenant;
let adminUser: any;


describe('Role Actions E2E Tests', () => {
    
    beforeAll(async () => {
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-role-${testRunId}` } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        
        const adminRes = await createUser({
            fullName: `Admin For Role Test ${testRunId}`,
            email: `admin-for-role-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user for test setup");
        adminUser = await getUserProfileData(adminRes.userId);
        
        await prisma.role.deleteMany({ where: { name: testRoleName } });
    });
    
    afterAll(async () => {
        try {
            await prisma.role.deleteMany({ where: { name: testRoleName } });
            if (adminUser) await prisma.user.delete({ where: { id: adminUser.id }});
            if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
            console.error(`[ROLE TEST CLEANUP] - Failed to delete records:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new role via action and verify it in the database', async () => {
        // Arrange
        const newRoleData: RoleFormData = {
            name: testRoleName,
            description: 'Um perfil de teste criado via action.',
            permissions: ['auctions:read', 'lots:read']
        };

        // Act
        const result = await callActionAsUser(createRole, adminUser, newRoleData);

        // Assert
        assert.strictEqual(result.success, true, 'createRole action should return success: true');
        assert.ok(result.roleId, 'createRole action should return a roleId');

        const createdRoleFromDb = await prisma.role.findUnique({
            where: { id: result.roleId },
        });

        assert.ok(createdRoleFromDb, 'Role should be found in the database');
        assert.strictEqual(createdRoleFromDb.name, newRoleData.name, 'Role name should match');
        assert.strictEqual(createdRoleFromDb.nameNormalized, testRoleName.toUpperCase().replace(/\s/g, '_'), 'Role nameNormalized should be correct');
        assert.deepStrictEqual(createdRoleFromDb.permissions, newRoleData.permissions, 'Role permissions should match');
    });

});
