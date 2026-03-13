/**
 * Audit script: counts rows and null columns for ALL tables in the database.
 * Usage: DATABASE_URL=... npx tsx scripts/audit-all-tables.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get all tables
  const tables: Array<{ table_name: string }> = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  console.log(`\n📊 AUDIT: ${tables.length} tables found\n`);

  const empty: string[] = [];
  const filled: string[] = [];
  const nullReport: Array<{ table: string; column: string; nullCount: number; totalRows: number }> = [];

  for (const { table_name } of tables) {
    try {
      const countResult: Array<{ count: bigint }> = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM "${table_name}"`
      );
      const count = Number(countResult[0].count);

      if (count === 0) {
        empty.push(table_name);
        console.log(`❌ ${table_name}: 0 rows`);
      } else {
        filled.push(table_name);
        console.log(`✅ ${table_name}: ${count} rows`);

        // Check for null columns
        const columns: Array<{ column_name: string }> = await prisma.$queryRawUnsafe(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = '${table_name}'
          ORDER BY ordinal_position
        `);

        for (const { column_name } of columns) {
          const nullResult: Array<{ null_count: bigint }> = await prisma.$queryRawUnsafe(
            `SELECT COUNT(*) as null_count FROM "${table_name}" WHERE "${column_name}" IS NULL`
          );
          const nullCount = Number(nullResult[0].null_count);
          if (nullCount > 0 && nullCount === count) {
            nullReport.push({ table: table_name, column: column_name, nullCount, totalRows: count });
          }
        }
      }
    } catch (e: any) {
      console.log(`⚠️ ${table_name}: ERROR - ${e.message?.substring(0, 80)}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total tables: ${tables.length}`);
  console.log(`Filled: ${filled.length}`);
  console.log(`Empty: ${empty.length}`);
  
  if (empty.length > 0) {
    console.log(`\n❌ EMPTY TABLES (${empty.length}):`);
    empty.forEach(t => console.log(`  - ${t}`));
  }

  if (nullReport.length > 0) {
    console.log(`\n⚠️ COLUMNS WITH ALL NULLS (${nullReport.length}):`);
    nullReport.forEach(r => console.log(`  - ${r.table}.${r.column} (${r.nullCount}/${r.totalRows} null)`));
  }

  console.log(`\n✅ FILLED TABLES (${filled.length}):`);
  filled.forEach(t => console.log(`  - ${t}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
