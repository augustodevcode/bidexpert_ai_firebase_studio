
// tests/court.test.ts
import { describe, it, beforeEach, afterAll } from 'vitest';
import assert from 'node:assert';
import { createCourt } from '../src/app/admin/courts/actions';
import { prisma } from '../src/lib/prisma';
import type { CourtFormData } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

const testRunId = `court-e2e-${uuidv4().substring(0, 8)}`;
const testCourtName = `Tribunal de Teste ${testRunId}`;

describe('Court Actions E2E Tests', () => {

    beforeEach(async () => {
        await prisma.court.deleteMany({ where: { name: testCourtName }});
    });
    
    afterAll(async () => {
        try {
            await prisma.court.deleteMany({ where: { name: testCourtName } });
        } catch (error) {
            // Ignore cleanup errors
        }
        await prisma.$disconnect();
    });

    it('should create a new court via action and verify it in the database', async () => {
        // Arrange
        const newCourtData: CourtFormData = {
            name: testCourtName,
            stateUf: 'TS',
            website: 'https://test-court.example.com'
        };

        // Act
        const result = await createCourt(newCourtData);

        // Assert
        assert.strictEqual(result.success, true, 'createCourt action should return success: true');
        assert.ok(result.courtId, 'createCourt action should return a courtId');

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
