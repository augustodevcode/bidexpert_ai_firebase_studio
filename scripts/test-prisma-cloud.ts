/**
 * Test Prisma Cloud Connectivity (Accelerate)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Testando conectividade com Prisma Accelerate...\n');
  
  try {
    const count = await prisma.tenant.count();
    console.log('✅ Conexão bem-sucedida!');
    console.log(`📊 Tenants no banco: ${count}\n`);
    
    // Listar primeiros 3 tenants
    const tenants = await prisma.tenant.findMany({ take: 3 });
    console.log('📋 Primeiros tenants:');
    tenants.forEach(t => {
      console.log(`   - ${t.slug} (ID: ${t.id})`);
    });
    
    return true;
  } catch (error: any) {
    console.error('❌ Erro de conexão:');
    console.error(`   ${error.message}\n`);
    
    if (error.code) {
      console.error(`   Código: ${error.code}`);
    }
    
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
