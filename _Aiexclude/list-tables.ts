import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listTables() {
  const tables = await prisma.$queryRaw<any[]>`SHOW TABLES`;
  console.log('📋 Tabelas no banco de dados:\n');
  tables.forEach((row: any) => {
    const tableName = Object.values(row)[0];
    console.log(`  - ${tableName}`);
  });
  console.log(`\n✅ Total: ${tables.length} tabelas`);
}

listTables()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
