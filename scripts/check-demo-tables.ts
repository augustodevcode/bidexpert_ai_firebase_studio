#!/usr/bin/env tsx
/**
 * Script para verificar se o schema foi aplicado no Prisma Cloud DEMO
 * Usa Prisma Accelerate para executar query no information_schema
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  console.log('🔍 Verificando tabelas no Prisma Cloud...\n');
  
  try {
    // Query no information_schema do PostgreSQL
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const tableCount = Number(result[0].count);
    
    if (tableCount === 0) {
      console.log('❌ Database VAZIO - Nenhuma tabela encontrada');
      console.log('\n📋 AÇÃO NECESSÁRIA:');
      console.log('   1. Aplique o schema via Console Prisma OU');
      console.log('   2. Execute: .\scripts\apply-schema-console.ps1\n');
      return false;
    } else {
      console.log(`✅ Schema APLICADO - ${tableCount} tabelas encontradas\n`);
      
      // Listar algumas tabelas para confirmar
      const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
        LIMIT 10
      `;
      
      console.log('📊 Primeiras 10 tabelas:');
      tables.forEach(t => console.log(`   - ${t.tablename}`));
      console.log(`   ... e mais ${tableCount - 10} tabelas\n`);
      
      return true;
    }
  } catch (error: any) {
    console.error('❌ Erro ao verificar schema:');
    console.error(`   ${error.message}\n`);
    
    if (error.message.includes('P6008')) {
      console.log('💡 Dica: Database server unreachable');
      console.log('   Verifique se o database está online no Console Prisma\n');
    }
    
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

checkTables()
  .then(hasSchema => {
    process.exit(hasSchema ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
