// tests/platform-settings.test.ts
import { test, describe, beforeAll, afterAll, expect } from 'vitest';
import { PlatformSettingsService } from '../services/platform-settings.service';
import { prisma } from '../lib/prisma';
import type { PlatformSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';

const settingsService = new PlatformSettingsService();
const testRunId = `settings-e2e-${uuidv4().substring(0, 8)}`;
const testSiteTitle = `BidExpert Test ${testRunId}`;

describe('Platform Settings Service E2E Tests', () => {
    
    let originalSettings: PlatformSettings | null;

    beforeAll(async () => {
        originalSettings = await prisma.platformSettings.findFirst();
    });

    afterAll(async () => {
        if (originalSettings) {
            await prisma.platformSettings.update({
                where: { id: 'global' },
                data: {
                    siteTitle: originalSettings.siteTitle,
                    siteTagline: originalSettings.siteTagline,
                    searchItemsPerPage: originalSettings.searchItemsPerPage,
                },
            });
        }
        await prisma.$disconnect();
    });

    test('should update platform settings via the service and verify changes in the database', async () => {
        // Arrange
        const newSettingsData: Partial<PlatformSettings> = {
            siteTitle: testSiteTitle,
            siteTagline: "Plataforma de Leilões para Teste E2E do Serviço",
            searchItemsPerPage: 25,
        };

        // Act
        const result = await settingsService.updateSettings(newSettingsData);

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();

        const updatedSettingsFromDb = await prisma.platformSettings.findUnique({
            where: { id: 'global' },
        });

        console.log('--- PlatformSettings Record Found in DB after Service Update ---');
        console.log(updatedSettingsFromDb);
        console.log('------------------------------------------------------------');
        
        expect(updatedSettingsFromDb).not.toBeNull();
        expect(updatedSettingsFromDb?.siteTitle).toBe(newSettingsData.siteTitle);
        expect(updatedSettingsFromDb?.siteTagline).toBe(newSettingsData.siteTagline);
        expect(updatedSettingsFromDb?.searchItemsPerPage).toBe(newSettingsData.searchItemsPerPage);
    });
});
