// tests/role.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { RoleService } from '../src/services/role.service';
import { prisma } from '../src/lib/prisma';
import type { RoleFormData } from '../src/types';

const roleService = new RoleService();
const testRoleName = 'Perfil de Teste E2E';
const testRoleNameNormalized = 'PERFIL_DE_TESTE_E2E';

test.describe('Role Service E2E Tests', () => {
    
    test.after(async () => {
        try {
            await prisma.role.deleteMany({
                where: { name: testRoleName }
            });
        } catch (error) {
            // Ignore cleanup errors
        }
        await prisma.$disconnect();
    });

    test('should create a new role and verify it in the database', async () => {
        // Arrange
        const newRoleData: RoleFormData = {
            name: testRoleName,
            description: 'Um perfil de teste criado via teste E2E.',
            permissions: ['auctions:read', 'lots:read']
        };

        // Act
        const result = await roleService.createRole(newRoleData);

        // Assert: Check the service method result
        assert.strictEqual(result.success, true, 'RoleService.createRole should return success: true');
        assert.ok(result.roleId, 'RoleService.createRole should return a roleId');

        // Assert: Verify directly in the database
        const createdRoleFromDb = await prisma.role.findUnique({
            where: { id: result.roleId },
        });

        console.log('--- Role Record Found in DB ---');
        console.log(createdRoleFromDb);
        console.log('-----------------------------');
        
        assert.ok(createdRoleFromDb, 'Role should be found in the database after creation');
        assert.strictEqual(createdRoleFromDb.name, newRoleData.name, 'Role name should match');
        assert.strictEqual(createdRoleFromDb.nameNormalized, testRoleNameNormalized, 'Role nameNormalized should be correct');
        assert.deepStrictEqual(createdRoleFromDb.permissions, newRoleData.permissions, 'Role permissions should match');
    });

});
