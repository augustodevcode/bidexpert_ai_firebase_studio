import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🚀 Aplicando migration add_tenantid...\n');
  
  try {
    // Ler arquivo SQL
    const sqlPath = path.join(__dirname, 'migration_add_tenantid.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    
    // Separar comandos SQL
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 ${commands.length} comandos SQL para executar\n`);
    
    let executed = 0;
    let errors = 0;
    
    for (const command of commands) {
      try {
        if (command.includes('ALTER TABLE') || command.includes('ADD COLUMN')) {
          await prisma.$executeRawUnsafe(command);
          executed++;
          console.log(`✅ Executado: ${command.substring(0, 80)}...`);
        }
      } catch (error: any) {
        if (error.message.includes('Duplicate column name')) {
          console.log(`⚠️  Coluna já existe: ${command.substring(0, 60)}...`);
        } else if (error.message.includes('Duplicate key name')) {
          console.log(`⚠️  Índice já existe: ${command.substring(0, 60)}...`);
        } else {
          errors++;
          console.error(`❌ Erro: ${error.message.substring(0, 100)}`);
        }
      }
    }
    
    console.log(`\n📊 Resumo:`);
    console.log(`   Executados: ${executed}`);
    console.log(`   Erros: ${errors}`);
    console.log(`\n✅ Migration concluída!`);
    
  } catch (error) {
    console.error('\n❌ Erro fatal:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration().catch((error) => {
  console.error(error);
  process.exit(1);
});
