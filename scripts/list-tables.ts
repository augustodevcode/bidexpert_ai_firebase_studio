import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listTables() {
  try {
    const tables = await prisma.$queryRaw<Array<{ TABLE_NAME: string }>>`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `;
    
    console.log('\n📋 Tabelas no banco de dados:\n');
    tables.forEach((table, idx) => {
      console.log(`${(idx + 1).toString().padStart(3)}. ${table.TABLE_NAME}`);
    });
    
    console.log(`\n📊 Total: ${tables.length} tabelas\n`);
    
    // Verificar quais têm tenantId
    console.log('\n🔍 Verificando colunas tenantId...\n');
    
    for (const table of tables.slice(0, 50)) {  // Limitar a 50 tabelas
      const columns = await prisma.$queryRaw<Array<{ COLUMN_NAME: string }>>`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ${table.TABLE_NAME}
        AND COLUMN_NAME = 'tenantId'
      `;
      
      if (columns.length > 0) {
        console.log(`✅ ${table.TABLE_NAME}`);
      }
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listTables();
