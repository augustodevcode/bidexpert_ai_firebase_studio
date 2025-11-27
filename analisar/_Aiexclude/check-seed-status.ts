import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSeedStatus() {
  try {
    console.log('🔍 Verificando status do banco de dados...\n');

    // Verifica tabelas importantes para cada etapa
    const checks = [
      { name: 'Configurações da Plataforma', table: 'PlatformSettings', query: 'SELECT COUNT(*) as count FROM "PlatformSettings"' },
      { name: 'Tipos de Documentos', table: 'DocumentType', query: 'SELECT COUNT(*) as count FROM "DocumentType"' },
      { name: 'Estados', table: 'State', query: 'SELECT COUNT(*) as count FROM "State"' },
      { name: 'Cidades', table: 'City', query: 'SELECT COUNT(*) as count FROM "City"' },
      { name: 'Usuários', table: 'User', query: 'SELECT COUNT(*) as count FROM "User"' },
      { name: 'Comitentes', table: 'Seller', query: 'SELECT COUNT(*) as count FROM "Seller"' },
      { name: 'Bancos', table: 'Bank', query: 'SELECT COUNT(*) as count FROM "Bank"' },
      { name: 'Contas Bancárias', table: 'BankAccount', query: 'SELECT COUNT(*) as count FROM "BankAccount"' },
      { name: 'Ativos (Bens)', table: 'Asset', query: 'SELECT COUNT(*) as count FROM "Asset"' },
      { name: 'Leilões', table: 'Auction', query: 'SELECT COUNT(*) as count FROM "Auction"' },
      { name: 'Lotes', table: 'Lot', query: 'SELECT COUNT(*) as count FROM "Lot"' },
    ];

    console.log('📊 Status das Tabelas:');
    console.log('---------------------');
    
    for (const check of checks) {
      try {
        const result = await prisma.$queryRawUnsafe(check.query) as any[];
        const count = result[0]?.count || 0;
        console.log(`- ${check.name.padEnd(25)}: ${count.toString().padStart(4)} registros`);
      } catch (error) {
        console.log(`- ${check.name.padEnd(25)}: Tabela não encontrada ou erro ao acessar`);
      }
    }

    console.log('\n✅ Verificação concluída!');
    console.log('\n📌 Próximos passos:');
    console.log('1. Verifique as tabelas acima para ver quais etapas já foram concluídas');
    console.log('2. Use o comando correto para continuar o seeding da etapa necessária');
    console.log('3. Se necessário, use o script seed-resume.ts para continuar de onde parou');

  } catch (error) {
    console.error('❌ Erro ao verificar status do banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSeedStatus();
