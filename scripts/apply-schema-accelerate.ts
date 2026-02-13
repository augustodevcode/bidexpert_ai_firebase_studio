/**
 * Apply schema via Prisma Accelerate
 * (Workaround for db.prisma.io connectivity issues)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applySchema() {
  console.log('📐 Aplicando schema via Prisma Accelerate...\n');
  
  try {
    // Test connection first
    console.log('🔍 Testando conexão...');
    await prisma.$connect();
    console.log('✅ Conectado!\n');
    
    // Check if tables exist
    console.log('📊 Verificando tabelas existentes...');
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    ` as any[];
    
    console.log(`   Tabelas encontradas: ${result.length}`);
    if (result.length === 0) {
      console.log('⚠️  Banco vazio - schema precisa ser aplicado via Prisma Studio ou migrations');
      console.log('\n📝 AÇÃO NECESSÁRIA:');
      console.log('   1. Acesse: https://console.prisma.io/[seu-projeto]/studio');
      console.log('   2. Ou use: npx prisma migrate deploy (se migrations existirem)');
      console.log('   3. Ou aplique schema manualmente no console SQL');
    } else {
      console.log('\n📋 Tabelas:');
      result.forEach((t: any) => console.log(`   - ${t.table_name}`));
    }
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

applySchema();
