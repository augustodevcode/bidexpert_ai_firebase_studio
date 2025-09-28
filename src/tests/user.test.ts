// tests/user.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import type { UserCreationData, Tenant, Role } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';

// Mock server-only to allow testing server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createUser, getUserProfileData, deleteUser } from '@/app/admin/users/actions';


const testRunId = `user-e2e-${uuidv4().substring(0, 8)}`;
const testUserEmail = `teste.usuario.${testRunId}@example.com`;
let testTenant: Tenant;
let userRole: Role;
let adminUser: any; // O usuário que executa a ação

describe('User Actions E2E Tests', () => {

    beforeAll(async () => {
        testTenant = await prisma.tenant.create({ data: { name: `User Test Tenant ${testRunId}`, subdomain: `user-test-${testRunId}` } });
        userRole = await prisma.role.upsert({ where: { nameNormalized: 'USER' }, update: {}, create: { name: 'User', nameNormalized: 'USER', permissions: ['view_auctions'] } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        
        const adminRes = await createUser({
            fullName: `Admin For User Test ${testRunId}`,
            email: `admin-for-user-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole!.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user for test setup");
        adminUser = await getUserProfileData(adminRes.userId);
    });

    afterAll(async () => {
        try {
            await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
            await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
            console.error(`[USER TEST CLEANUP] - Failed to delete records:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new user with default role via server action', async () => {
        // Arrange
        const newUser: UserCreationData = {
            fullName: `Usuário de Teste ${testRunId}`,
            email: testUserEmail,
            password: 'aSecurePassword123',
            roleIds: [userRole.id],
            tenantId: testTenant.id,
        };

        // Act
        const result = await callActionAsUser(createUser, adminUser, newUser);

        // Assert
        assert.strictEqual(result.success, true, 'createUser action should return success: true');
        assert.ok(result.userId, 'createUser action should return a userId');

        const createdUserFromDb = await prisma.user.findUnique({
            where: { id: result.userId },
            include: { roles: { include: { role: true } }, tenants: true },
        });

        assert.ok(createdUserFromDb, 'User should be found in the database');
        assert.strictEqual(createdUserFromDb.email, testUserEmail, 'User email should match');
        assert.ok(createdUserFromDb.password, 'User password should be set (hashed)');
        assert.notStrictEqual(createdUserFromDb.password, newUser.password, 'User password should be hashed');
        assert.strictEqual(createdUserFromDb.roles.length, 1, 'User should have exactly one role');
        assert.strictEqual(createdUserFromDb.roles[0].role.name, 'User', 'The assigned role should be USER');
        assert.strictEqual(createdUserFromDb.tenants.length, 1, 'User should be assigned to one tenant');
        assert.strictEqual(createdUserFromDb.tenants[0].tenantId, testTenant.id, 'User should be assigned to the correct tenant');
    });
});
