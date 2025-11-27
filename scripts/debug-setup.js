// debug-setup.js - Script para verificar o estado do setup no banco de dados
const { PrismaClient } = require('@prisma/client');

async function debugSetup() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando estado do setup no banco de dados...\n');
    
    // Verificar se existe algum registro de platformSettings
    const settings = await prisma.platformSettings.findMany();
    
    console.log('📊 Registros de platformSettings encontrados:', settings.length);
    
    if (settings.length > 0) {
      settings.forEach((setting, index) => {
        console.log(`\n📋 Registro ${index + 1}:`);
        console.log(`   ID: ${setting.id}`);
        console.log(`   isSetupComplete: ${setting.isSetupComplete}`);
        console.log(`   siteTitle: ${setting.siteTitle}`);
        console.log(`   tenantId: ${setting.tenantId || 'null'}`);
      });
    } else {
      console.log('❌ Nenhum registro de platformSettings encontrado!');
    }
    
    // Verificar tenants
    console.log('\n🏢 Verificando tenants...');
    const tenants = await prisma.tenant.findMany();
    console.log(`📊 Tenants encontrados: ${tenants.length}`);
    
    tenants.forEach((tenant, index) => {
      console.log(`   Tenant ${index + 1}: ${tenant.name} (ID: ${tenant.id})`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSetup();
