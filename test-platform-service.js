// test-platform-service.js - Testar o PlatformSettingsService
const { PrismaClient } = require('@prisma/client');

// Simular o contexto de tenant
const tenantContext = {
  run: (context, callback) => {
    console.log(`🏢 Executando no contexto do tenant: ${context.tenantId}`);
    return callback();
  }
};

// Simular o PlatformSettingsRepository
class PlatformSettingsRepository {
  constructor() {
    this.prisma = new PrismaClient();
  }
  
  async findFirst() {
    console.log('🔍 PlatformSettingsRepository.findFirst() chamado');
    const settings = await this.prisma.platformSettings.findFirst();
    console.log('📋 Resultado do findFirst:', {
      id: settings?.id,
      isSetupComplete: settings?.isSetupComplete,
      siteTitle: settings?.siteTitle
    });
    return settings;
  }
}

// Simular o PlatformSettingsService
class PlatformSettingsService {
  constructor() {
    this.repository = new PlatformSettingsRepository();
  }

  async getSettings() {
    console.log('🚀 PlatformSettingsService.getSettings() iniciado');
    const settings = await this.repository.findFirst();
    
    if (!settings) {
      console.log("⚠️ Nenhuma configuração encontrada, criaria configurações padrão...");
      return null;
    }
    
    console.log('✅ Configurações encontradas:', {
      id: settings.id,
      isSetupComplete: settings.isSetupComplete,
      siteTitle: settings.siteTitle
    });
    
    return settings;
  }
}

async function testPlatformService() {
  console.log('🧪 Testando PlatformSettingsService...\n');
  
  const service = new PlatformSettingsService();
  
  try {
    const settings = await service.getSettings();
    
    console.log('\n📊 Resultado final:');
    console.log(`   isSetupComplete: ${settings?.isSetupComplete}`);
    console.log(`   Tipo: ${typeof settings?.isSetupComplete}`);
    
    if (settings?.isSetupComplete === true) {
      console.log('✅ Setup está completo - não deveria redirecionar');
    } else {
      console.log('❌ Setup não está completo - redirecionaria para /setup');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    process.exit(0);
  }
}

testPlatformService();
