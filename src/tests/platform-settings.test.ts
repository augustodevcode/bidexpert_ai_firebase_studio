// tests/platform-settings.test.ts
import { test, describe, beforeAll, afterAll } from 'vitest';
import assert from 'node:assert';
import { PlatformSettingsService } from '../services/platform-settings.service';
import { prisma } from '../lib/prisma';
import type { PlatformSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';

const settingsService = new PlatformSettingsService();
const testRunId = `settings-e2e-${uuidv4().substring(0, 8)}`;
const testSiteTitle = `BidExpert Test ${testRunId}`;

describe('Platform Settings Service E2E Tests', () => {
    
    // Armazena as configurações originais para restaurá-las depois
    let originalSettings: PlatformSettings | null;

    beforeAll(async () => {
        // Salva as configurações atuais para restaurar no final
        originalSettings = await prisma.platformSettings.findFirst();
    });

    afterAll(async () => {
        // Restaura as configurações originais após todos os testes
        if (originalSettings) {
            await prisma.platformSettings.update({
                where: { id: 'global' },
                data: {
                    siteTitle: originalSettings.siteTitle,
                    siteTagline: originalSettings.siteTagline,
                    searchItemsPerPage: originalSettings.searchItemsPerPage,
                    // Adicione outros campos para restaurar conforme necessário
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
            searchItemsPerPage: 25, // Usar um número diferente para garantir que a atualização funcione
        };

        // Act: Chamar o método do serviço, que é a camada usada pela Server Action
        const result = await settingsService.updateSettings(newSettingsData);

        // Assert: Verificar o resultado do método do serviço
        assert.strictEqual(result.success, true, 'PlatformSettingsService.updateSettings should return success: true');
        assert.ok(result.message, 'PlatformSettingsService.updateSettings should return a message');

        // Assert: Verificar diretamente no banco de dados
        const updatedSettingsFromDb = await prisma.platformSettings.findUnique({
            where: { id: 'global' },
        });

        console.log('--- PlatformSettings Record Found in DB after Service Update ---');
        console.log(updatedSettingsFromDb);
        console.log('------------------------------------------------------------');
        
        assert.ok(updatedSettingsFromDb, 'Settings should be found in the database');
        assert.strictEqual(updatedSettingsFromDb.siteTitle, newSettingsData.siteTitle, 'Settings siteTitle should match');
        assert.strictEqual(updatedSettingsFromDb.siteTagline, newSettingsData.siteTagline, 'Settings siteTagline should match');
        assert.strictEqual(updatedSettingsFromDb.searchItemsPerPage, newSettingsData.searchItemsPerPage, 'Settings searchItemsPerPage should match');
    });
});
