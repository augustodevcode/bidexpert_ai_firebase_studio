// tests/platform-settings.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { PlatformSettingsService } from '../src/services/platform-settings.service';
import { prisma } from '../src/lib/prisma';
import type { PlatformSettings } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

const settingsService = new PlatformSettingsService();
const testRunId = `settings-e2e-${uuidv4().substring(0, 8)}`;
const testSiteTitle = `BidExpert Test ${testRunId}`;

test.describe('Platform Settings Service E2E Tests', () => {

    test.after(async () => {
        // Clean up or reset to default state if necessary
        await prisma.$disconnect();
    });

    test('should update platform settings and verify the changes in the database', async () => {
        // Arrange
        const newSettingsData: Partial<PlatformSettings> = {
            siteTitle: testSiteTitle,
            siteTagline: 'Plataforma de Leilões para Teste E2E',
            searchItemsPerPage: 15,
        };

        // Act
        const result = await settingsService.updateSettings(newSettingsData);

        // Assert: Check the service method result
        assert.strictEqual(result.success, true, 'PlatformSettingsService.updateSettings should return success: true');
        assert.strictEqual(result.message, 'Configurações atualizadas com sucesso.', 'Success message should be correct');

        // Assert: Verify directly in the database
        const updatedSettingsFromDb = await prisma.platformSettings.findFirst();
        
        console.log('--- PlatformSettings Record Found in DB ---');
        console.log(updatedSettingsFromDb);
        console.log('-----------------------------------------');

        assert.ok(updatedSettingsFromDb, 'Settings should exist in the database');
        assert.strictEqual(updatedSettingsFromDb.siteTitle, testSiteTitle, 'Site title should be updated');
        assert.strictEqual(updatedSettingsFromDb.siteTagline, 'Plataforma de Leilões para Teste E2E', 'Site tagline should be updated');
        assert.strictEqual(updatedSettingsFromDb.searchItemsPerPage, 15, 'Search items per page should be updated');
    });

});
