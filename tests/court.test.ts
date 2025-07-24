// tests/court.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { CourtService } from '../src/services/court.service';
import { prisma } from '../src/lib/prisma';
import type { CourtFormData } from '../src/types';

const courtService = new CourtService();
const testCourtName = 'Tribunal de Teste E2E';

test.describe('Court Service E2E Tests', () => {
    
    test.after(async () => {
        try {
            await prisma.court.deleteMany({
                where: { name: testCourtName }
            });
        } catch (error) {
            // Ignore cleanup errors
        }
        await prisma.$disconnect();
    });

    test('should create a new court and verify it in the database', async () => {
        // Arrange
        const newCourtData: CourtFormData = {
            name: testCourtName,
            stateUf: 'TS',
            website: 'https://test-court.example.com'
        };

        // Act
        const result = await courtService.createCourt(newCourtData);

        // Assert: Check the result of the service method
        assert.strictEqual(result.success, true, 'CourtService.createCourt should return success: true');
        assert.ok(result.courtId, 'CourtService.createCourt should return a courtId');

        // Assert: Verify directly in the database
        const createdCourtFromDb = await prisma.court.findUnique({
            where: { id: result.courtId },
        });

        console.log('--- Court Record Found in DB ---');
        console.log(createdCourtFromDb);
        console.log('--------------------------------');
        
        assert.ok(createdCourtFromDb, 'Court should be found in the database after creation');
        assert.strictEqual(createdCourtFromDb.name, newCourtData.name, 'Court name should match');
        assert.strictEqual(createdCourtFromDb.stateUf, newCourtData.stateUf, 'Court stateUf should match');
    });

});
