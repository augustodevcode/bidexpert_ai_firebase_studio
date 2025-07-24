// tests/user.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { UserService } from '../src/services/user.service';
import { prisma } from '../src/lib/prisma';
import type { UserCreationData } from '../src/types';

const userService = new UserService();
const testUserEmail = 'test.user.e2e@example.com';

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
        const newUser: UserCreationData = {
            fullName: 'Usuário de Teste E2E',
            email: testUserEmail,
            password: 'aSecurePassword123',
        };

        // Act
        const result = await userService.createUser(newUser);

        // Assert: Check the service method result
        assert.strictEqual(result.success, true, 'UserService.createUser should return success: true');
        assert.ok(result.userId, 'UserService.createUser should return a userId');

        // Assert: Verify directly in the database
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
