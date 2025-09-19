// tests/auth.test.ts
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import assert from 'node:assert';
import { login } from '@/app/auth/actions';
import { prisma } from '@/lib/prisma';
import { UserService } from '@/services/user.service';
import { RoleRepository } from '@/repositories/role.repository';
import type { UserProfileWithPermissions } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const testRunId = `auth-e2e-${uuidv4().substring(0, 8)}`;
const userService = new UserService();
const roleRepository = new RoleRepository();

let adminUser: UserProfileWithPermissions | null;
const adminEmail = `admin-${testRunId}@bidexpert.com.br`;
const adminPassword = 'PasswordForTesting123';

describe('Authentication (Login) E2E Test', () => {

    beforeAll(async () => {
        console.log(`[E2E Setup - auth.test.ts - ${testRunId}] Starting...`);
        // 1. Ensure Landlord Tenant and Admin Role exist
        const landlordTenant = await prisma.tenant.upsert({
            where: { id: '1' },
            update: {},
            create: { id: '1', name: 'Landlord', subdomain: 'www' },
        });

        const adminRole = await roleRepository.findByNormalizedName('ADMINISTRATOR');
        assert.ok(adminRole, "ADMINISTRATOR role must exist. Please seed the database.");

        // 2. Create the admin user for this test run
        const userRes = await userService.createUser({
            fullName: `Admin Test ${testRunId}`,
            email: adminEmail,
            password: adminPassword,
            roleIds: [adminRole!.id],
            habilitationStatus: 'HABILITADO',
            tenantId: landlordTenant.id, // Explicitly associate with landlord tenant
        });

        assert.ok(userRes.success && userRes.userId, 'Admin user creation for test failed.');
        adminUser = await userService.getUserById(userRes.userId!);
        assert.ok(adminUser, 'Could not retrieve created admin user.');
        console.log(`- Created admin user for test: ${adminUser.email}`);
    });

    afterAll(async () => {
        console.log(`[E2E Teardown - auth.test.ts - ${testRunId}] Cleaning up...`);
        if (adminUser) {
            await userService.deleteUser(adminUser.id);
        }
        await prisma.$disconnect();
    });

    it('should successfully log in the admin user for the landlord tenant', async () => {
        // Arrange
        console.log('--- Test Case: Admin Login for Landlord Tenant ---');
        const formData = new FormData();
        formData.append('email', adminEmail);
        formData.append('password', adminPassword);
        formData.append('tenantId', '1'); // Explicitly logging into the Landlord tenant

        // Act
        console.log(`- ACTION: Attempting login for ${adminEmail} on tenant '1'`);
        const result = await login(formData);

        // Assert
        console.log('- ASSERT: Verifying login result...');
        assert.strictEqual(result.success, true, `Login should be successful. Message: ${result.message}`);
        assert.ok(result.user, 'The user profile should be returned on successful login.');
        assert.strictEqual(result.user.email, adminEmail, 'The email of the logged-in user should match.');
        assert.ok(result.user.roleNames?.includes('Administrator'), 'User should have the Administrator role.');
        assert.ok(result.user.tenants?.some(t => t.id === '1'), 'User should be associated with the Landlord tenant.');
        console.log('--- ✅ PASSED: Admin login successful. ---');
    });

    it('should fail to log in with incorrect password', async () => {
        // Arrange
        console.log('--- Test Case: Failed Login (Incorrect Password) ---');
        const formData = new FormData();
        formData.append('email', adminEmail);
        formData.append('password', 'wrong-password');
        formData.append('tenantId', '1');

        // Act
        console.log(`- ACTION: Attempting login for ${adminEmail} with wrong password.`);
        const result = await login(formData);

        // Assert
        console.log('- ASSERT: Verifying login failure...');
        assert.strictEqual(result.success, false, 'Login should fail.');
        assert.strictEqual(result.message, 'Credenciais inválidas.', 'Error message should indicate invalid credentials.');
        console.log('--- ✅ PASSED: Login with incorrect password correctly failed. ---');
    });

    it('should fail to log in with non-existent email', async () => {
        // Arrange
        console.log('--- Test Case: Failed Login (Non-existent Email) ---');
        const formData = new FormData();
        formData.append('email', `nonexistent-${testRunId}@test.com`);
        formData.append('password', 'any-password');
        formData.append('tenantId', '1');

        // Act
        console.log(`- ACTION: Attempting login for non-existent user.`);
        const result = await login(formData);

        // Assert
        console.log('- ASSERT: Verifying login failure...');
        assert.strictEqual(result.success, false, 'Login should fail.');
        assert.strictEqual(result.message, 'Credenciais inválidas.', 'Error message should indicate invalid credentials for non-existent user.');
        console.log('--- ✅ PASSED: Login with non-existent email correctly failed. ---');
    });
});
