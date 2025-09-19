// tests/user.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { UserService } from '../src/services/user.service';
import { prisma } from '../src/lib/prisma';
import type { UserCreationData } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

const userService = new UserService();
const testRunId = `user-e2e-${uuidv4().substring(0, 8)}`;
const testUserEmail = `teste.usuario.${testRunId}@example.com`;

test.describe('User Service E2E Tests', () => {
    test.after(async () => {
        try {
            await prisma.user.deleteMany({
                where: { email: testUserEmail }
            });
        } catch (error) {
            // Ignore cleanup errors
        }
        await prisma.$disconnect();
    });

    test('should create a new user and assign the default USER role', async () => {
        // Arrange
        const userRole = await prisma.role.findFirst({ where: { name: 'USER' }});
        assert.ok(userRole, "Default 'USER' role must exist in the database for this test to run.");
        
        const newUser: UserCreationData = {
            fullName: `Usuário de Teste ${testRunId}`,
            email: testUserEmail,
            password: 'aSecurePassword123',
            roleIds: [userRole!.id], // Pass the roleId explicitly
        };

        // Act
        const result = await userService.createUser(newUser);

        // Assert
        assert.strictEqual(result.success, true, 'UserService.createUser should return success: true');
        assert.ok(result.userId, 'UserService.createUser should return a userId');

        const createdUserFromDb = await prisma.user.findUnique({
            where: { id: result.userId },
            include: { roles: { include: { role: true } } },
        });

        console.log('--- User Record Found in DB ---');
        console.log(createdUserFromDb);
        console.log('-------------------------------');
        
        assert.ok(createdUserFromDb, 'User should be found in the database');
        assert.strictEqual(createdUserFromDb.email, testUserEmail, 'User email should match');
        assert.ok(createdUserFromDb.password, 'User password should be set (hashed)');
        assert.notStrictEqual(createdUserFromDb.password, newUser.password, 'User password should be hashed, not plaintext');
        
        assert.strictEqual(createdUserFromDb.roles.length, 1, 'User should have exactly one role assigned');
        assert.strictEqual(createdUserFromDb.roles[0].role.name, 'USER', 'The assigned role should be USER');
    });
});
