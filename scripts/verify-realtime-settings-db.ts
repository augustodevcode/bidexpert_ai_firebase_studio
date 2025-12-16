/**
 * @file verify-realtime-settings-db.ts
 * @description Verifica os dados do RealtimeSettings no banco
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('\n📊 Verificando RealtimeSettings no banco de dados...\n');
  
  const settings = await prisma.platformSettings.findFirst({
    include: {
      realtimeSettings: true,
    }
  });

  if (!settings) {
    console.log('❌ Nenhum PlatformSettings encontrado');
  } else {
    console.log('✅ PlatformSettings encontrado:');
    console.log(`   - ID: ${settings.id}`);
    console.log(`   - TenantID: ${settings.tenantId}`);
    
    if (settings.realtimeSettings) {
      console.log('\n✅ RealtimeSettings:');
      console.log(`   - ID: ${settings.realtimeSettings.id}`);
      console.log(`   - blockchainEnabled: ${settings.realtimeSettings.blockchainEnabled}`);
      console.log(`   - blockchainNetwork: ${settings.realtimeSettings.blockchainNetwork}`);
      console.log(`   - softCloseEnabled: ${settings.realtimeSettings.softCloseEnabled}`);
      console.log(`   - softCloseMinutes: ${settings.realtimeSettings.softCloseMinutes}`);
      console.log(`   - lawyerPortalEnabled: ${settings.realtimeSettings.lawyerPortalEnabled}`);
      console.log(`   - lawyerMonetizationModel: ${settings.realtimeSettings.lawyerMonetizationModel}`);
      console.log(`   - lawyerSubscriptionPrice: ${settings.realtimeSettings.lawyerSubscriptionPrice}`);
      console.log(`   - lawyerPerUsePrice: ${settings.realtimeSettings.lawyerPerUsePrice}`);
      console.log(`   - lawyerRevenueSharePercent: ${settings.realtimeSettings.lawyerRevenueSharePercent}`);
    } else {
      console.log('\n⚠️ RealtimeSettings não encontrado (null)');
    }
  }
  
  await prisma.$disconnect();
}

verify().catch(console.error);
