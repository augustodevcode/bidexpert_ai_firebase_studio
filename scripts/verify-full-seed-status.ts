
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 VERIFICAÇÃO DE DADOS - ULTIMATE MASTER SEED');
  console.log('==============================================');
  
  const tables = [
    'Tenant', 'User', 'Role', 'Permission',
    'Auction', 'Lot', 'Asset', 'AssetMedia',
    'JudicialProcess', 'Auctioneer', 'Seller',
    'LotCategory', 'Subcategory', 
    'AuctionHabilitation', 'Bid',
    'AuditLog', 'SystemLog',
    'Visitors', 'visitor_sessions',
    'Faq', 'ContactMessage',
    'VehicleMake', 'VehicleModel',
    'FinancialMovement', 'Invoice',
    'ItsmTicket', 'ItsmMessage'
  ];

  const results: Record<string, number> = {};

  for (const table of tables) {
    try {
      // @ts-ignore
      const count = await prisma[table[0].toLowerCase() + table.slice(1)].count();
      results[table] = count;
      console.log(`✅ ${table.padEnd(25)}: ${count}`);
    } catch (e) {
      console.log(`❌ ${table.padEnd(25)}: ERRO (Tabela não encontrada ou erro de conexão)`);
    }
  }

  console.log('\n📊 VERIFICAÇÃO DE INTEGRIDADE REFERENCIAL (AMOSTRA)');
  console.log('===================================================');

  // 1. Checar Leilões Judiciais com Processo
  const judicialAuctions = await prisma.auction.count({
    where: { auctionType: 'JUDICIAL' }
  });
  const judicialAuctionsWithProcess = await prisma.auction.count({
    where: { 
        auctionType: 'JUDICIAL',
        judicialProcessId: { not: null }
    }
  });
  console.log(`⚖️  Leilões Judiciais       : ${judicialAuctions}`);
  console.log(`    Com Processo Vinculado  : ${judicialAuctionsWithProcess} (${judicialAuctions > 0 ? Math.round(judicialAuctionsWithProcess/judicialAuctions*100) : 0}%)`);

  // 2. Checar Lotes com Ativos Vinculados
  const totalLots = await prisma.lot.count();
  const lotsWithAssets = await prisma.lot.count({
    where: { AssetsOnLots: { some: {} } }
  });
  console.log(`📦 Lotes Totais            : ${totalLots}`);
  console.log(`    Com Ativos Vinculados   : ${lotsWithAssets} (${totalLots > 0 ? Math.round(lotsWithAssets/totalLots*100) : 0}%)`);

  // 3. Checar Usuários com Tenant
  const totalUsers = await prisma.user.count();
  const usersWithTenant = await prisma.user.count({
    where: { UsersOnTenants: { some: {} } }
  });
  console.log(`👥 Usuários Totais         : ${totalUsers}`);
  console.log(`    Com Tenant Vinculado    : ${usersWithTenant} (${totalUsers > 0 ? Math.round(usersWithTenant/totalUsers*100) : 0}%)`);

  // 4. Checar Habilitações
  const habs = await prisma.auctionHabilitation.count();
  console.log(`📝 Habilitações em Leilões : ${habs}`);

  // 5. Checar Mídias
  const mediaItems = await prisma.mediaItem.count();
  console.log(`🖼️  Media Items (Imagens)   : ${mediaItems}`);

  // 6. Veículos
  console.log(`🚗 Marcas de Veículos      : ${results['VehicleMake']}`);
  console.log(`    Modelos de Veículos     : ${results['VehicleModel']}`);

  // Summary
  console.log('\n==============================================');
  if (results['User'] > 10 && results['Auction'] > 10 && lotsWithAssets > 0) {
      console.log('✅ STATUS GERAL: DADOS DO ULTIMATE SEED DETECTADOS.');
  } else {
      console.log('⚠️  STATUS GERAL: BANCO PARECE ESTAR COM DADOS PARCIAIS OU VAZIO.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
