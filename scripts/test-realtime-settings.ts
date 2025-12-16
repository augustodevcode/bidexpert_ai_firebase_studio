/**
 * @file test-realtime-settings.ts
 * @description Script para testar o serviço de RealtimeSettings
 * Valida que o modelo RealtimeSettings foi criado corretamente e pode ser persistido
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRealtimeSettings() {
  console.log('='.repeat(60));
  console.log('🧪 Teste: RealtimeSettings Model');
  console.log('='.repeat(60));

  try {
    // 1. Buscar PlatformSettings existente com RealtimeSettings
    console.log('\n📋 1. Buscando PlatformSettings com RealtimeSettings...');
    
    const settingsWithRelation = await prisma.platformSettings.findFirst({
      include: {
        realtimeSettings: true,
      },
    });

    if (settingsWithRelation) {
      console.log('✅ PlatformSettings encontrado:');
      console.log(`   - ID: ${settingsWithRelation.id}`);
      console.log(`   - Site Title: ${settingsWithRelation.siteTitle}`);
      console.log(`   - RealtimeSettings: ${settingsWithRelation.realtimeSettings ? 'Existe' : 'Não existe'}`);
      
      if (settingsWithRelation.realtimeSettings) {
        console.log(`     - blockchainEnabled: ${settingsWithRelation.realtimeSettings.blockchainEnabled}`);
        console.log(`     - softCloseEnabled: ${settingsWithRelation.realtimeSettings.softCloseEnabled}`);
        console.log(`     - lawyerPortalEnabled: ${settingsWithRelation.realtimeSettings.lawyerPortalEnabled}`);
      }
    } else {
      console.log('⚠️ Nenhum PlatformSettings encontrado, criando...');
      
      // Criar PlatformSettings básico
      const newSettings = await prisma.platformSettings.create({
        data: {
          tenantId: BigInt(1),
          siteTitle: 'BidExpert Test',
        },
      });
      console.log(`✅ PlatformSettings criado com ID: ${newSettings.id}`);
    }

    // 2. Testar criação/atualização de RealtimeSettings
    console.log('\n📋 2. Testando upsert de RealtimeSettings...');
    
    const platformSettings = await prisma.platformSettings.findFirst();
    if (!platformSettings) {
      throw new Error('PlatformSettings não encontrado');
    }

    const testData = {
      blockchainEnabled: true,
      blockchainNetwork: 'polygon',
      softCloseEnabled: true,
      softCloseMinutes: 5,
      lawyerPortalEnabled: true,
      lawyerMonetizationModel: 'SUBSCRIPTION',
      lawyerSubscriptionPrice: 199.99,
      lawyerPerUsePrice: 29.99,
      lawyerRevenueSharePercent: 15.0,
    };

    const upsertedRealtimeSettings = await prisma.realtimeSettings.upsert({
      where: {
        platformSettingsId: platformSettings.id,
      },
      create: {
        platformSettingsId: platformSettings.id,
        ...testData,
      },
      update: testData,
    });

    console.log('✅ RealtimeSettings upsert bem sucedido:');
    console.log(`   - ID: ${upsertedRealtimeSettings.id}`);
    console.log(`   - platformSettingsId: ${upsertedRealtimeSettings.platformSettingsId}`);
    console.log(`   - blockchainEnabled: ${upsertedRealtimeSettings.blockchainEnabled}`);
    console.log(`   - blockchainNetwork: ${upsertedRealtimeSettings.blockchainNetwork}`);
    console.log(`   - softCloseEnabled: ${upsertedRealtimeSettings.softCloseEnabled}`);
    console.log(`   - softCloseMinutes: ${upsertedRealtimeSettings.softCloseMinutes}`);
    console.log(`   - lawyerPortalEnabled: ${upsertedRealtimeSettings.lawyerPortalEnabled}`);
    console.log(`   - lawyerMonetizationModel: ${upsertedRealtimeSettings.lawyerMonetizationModel}`);

    // 3. Verificar relação bidirecional
    console.log('\n📋 3. Verificando relação bidirecional...');
    
    const verifySettings = await prisma.platformSettings.findFirst({
      include: {
        realtimeSettings: true,
      },
    });

    if (verifySettings?.realtimeSettings) {
      console.log('✅ Relação bidirecional funcionando!');
      console.log(`   - PlatformSettings.id: ${verifySettings.id}`);
      console.log(`   - RealtimeSettings.platformSettingsId: ${verifySettings.realtimeSettings.platformSettingsId}`);
      console.log(`   - Valores corretos: ${verifySettings.realtimeSettings.blockchainEnabled === testData.blockchainEnabled ? '✓' : '✗'}`);
    } else {
      console.log('❌ Erro: RealtimeSettings não está relacionado');
    }

    // 4. Testar atualização parcial
    console.log('\n📋 4. Testando atualização parcial...');
    
    const partialUpdate = await prisma.realtimeSettings.update({
      where: {
        platformSettingsId: platformSettings.id,
      },
      data: {
        softCloseMinutes: 10,
        lawyerSubscriptionPrice: 249.99,
      },
    });

    console.log('✅ Atualização parcial bem sucedida:');
    console.log(`   - softCloseMinutes: ${partialUpdate.softCloseMinutes}`);
    console.log(`   - lawyerSubscriptionPrice: ${partialUpdate.lawyerSubscriptionPrice}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testRealtimeSettings();
