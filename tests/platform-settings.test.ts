// tests/platform-settings.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { updatePlatformSettings } from '../src/app/admin/settings/actions';
import { prisma } from '../src/lib/prisma';
import type { PlatformSettings } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

const testRunId = `settings-e2e-${uuidv4().substring(0, 8)}`;
const testSiteTitle = `BidExpert Test ${testRunId}`;

test.describe('Platform Settings Service E2E Tests', () => {
    
    test.after(async () => {
        // Clean up or reset the settings to a default state if necessary
        await prisma.platformSettings.update({
            where: { id: 'global' },
            data: { siteTitle: 'BidExpert', siteTagline: 'Sua plataforma especialista em leilões online.' }
        });
        await prisma.$disconnect();
    });

    test('should update platform settings and verify the changes in the database', async () => {
        // Arrange
        const newSettingsData: Partial<PlatformSettings> = {
            siteTitle: testSiteTitle,
            siteTagline: "Plataforma de Leilões para Teste E2E",
            searchItemsPerPage: 15
        };

        // Act: Call the server action directly
        const result = await updatePlatformSettings(newSettingsData);

        // Assert: Check the service method result
        assert.strictEqual(result.success, true, 'updatePlatformSettings action should return success: true');
        assert.ok(result.message, 'updatePlatformSettings action should return a message');

        // Assert: Verify directly in the database
        const updatedSettingsFromDb = await prisma.platformSettings.findUnique({
            where: { id: 'global' },
        });

        console.log('--- PlatformSettings Record Found in DB ---');
        console.log(updatedSettingsFromDb);
        console.log('-----------------------------------------');
        
        assert.ok(updatedSettingsFromDb, 'Settings should be found in the database');
        assert.strictEqual(updatedSettingsFromDb.siteTitle, newSettingsData.siteTitle, 'Settings siteTitle should match');
        assert.strictEqual(updatedSettingsFromDb.siteTagline, newSettingsData.siteTagline, 'Settings siteTagline should match');
        assert.strictEqual(updatedSettingsFromDb.searchItemsPerPage, newSettingsData.searchItemsPerPage, 'Settings searchItemsPerPage should match');
    });
});
