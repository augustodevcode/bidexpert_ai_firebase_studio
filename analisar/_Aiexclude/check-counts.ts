import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCounts() {
  console.log('Checking database counts...');
  
  const counts = {
    tenants: await prisma.tenant.count(),
    users: await prisma.user.count(),
    categories: await prisma.lotCategory.count(),
    assets: await prisma.asset.count(),
    auctions: await prisma.auction.count(),
    lots: await prisma.lot.count(),
    bids: await prisma.bid.count(),
    wins: await prisma.userWin.count(),
    judicialProcesses: await prisma.judicialProcess.count(),
    userDocuments: await prisma.userDocument.count(),
    directSaleOffers: await prisma.directSaleOffer.count(),
    notifications: await prisma.notification.count(),
    subscribers: await prisma.subscriber.count(),
    userLotMaxBids: await prisma.userLotMaxBid.count(),
    courts: await prisma.court.count(),
    judicialDistricts: await prisma.judicialDistrict.count(),
    judicialBranches: await prisma.judicialBranch.count(),
    sellers: await prisma.seller.count(),
    auctioneers: await prisma.auctioneer.count(),
    vehicleMakes: await prisma.vehicleMake.count(),
    vehicleModels: await prisma.vehicleModel.count(),
    cities: await prisma.city.count(),
    states: await prisma.state.count(),
  };
  
  console.log('\nResumo do Seeding:');
  console.log(`- Tenants: ${counts.tenants}`);
  console.log(`- Usuários: ${counts.users}`);
  console.log(`- Categorias: ${counts.categories}`);
  console.log(`- Ativos: ${counts.assets}`);
  console.log(`- Leilões: ${counts.auctions}`);
  console.log(`- Lotes: ${counts.lots}`);
  console.log(`- Lances: ${counts.bids}`);
  console.log(`- Arremates (Wins): ${counts.wins}`);
  console.log(`- Processos Judiciais: ${counts.judicialProcesses}`);
  console.log(`- Documentos de Usuários: ${counts.userDocuments}`);
  console.log(`- Ofertas de Venda Direta: ${counts.directSaleOffers}`);
  console.log(`- Notificações: ${counts.notifications}`);
  console.log(`- Assinantes: ${counts.subscribers}`);
  console.log(`- Lances Máximos (Auto-Lances): ${counts.userLotMaxBids}`);
  console.log(`- Tribunais: ${counts.courts}`);
  console.log(`- Comarcas: ${counts.judicialDistricts}`);
  console.log(`- Varas: ${counts.judicialBranches}`);
  console.log(`- Vendedores: ${counts.sellers}`);
  console.log(`- Leiloeiros: ${counts.auctioneers}`);
  console.log(`- Marcas de Veículos: ${counts.vehicleMakes}`);
  console.log(`- Modelos de Veículos: ${counts.vehicleModels}`);
  console.log(`- Cidades: ${counts.cities}`);
  console.log(`- Estados: ${counts.states}`);
  console.log('=====================================================');
  
  // Additional verification for requirements
  console.log('\nVerificação de Requisitos:');
  console.log(`- Ativos ativos (>= 2000): ${counts.assets >= 2000 ? '✅' : '❌'} (${counts.assets})`);
  console.log(`- Lotes (>= 1000): ${counts.lots >= 1000 ? '✅' : '❌'} (${counts.lots})`);
  console.log(`- Leilões (>= 500): ${counts.auctions >= 500 ? '✅' : '❌'} (${counts.auctions})`);
  console.log(`- Categorias (>= 20): ${counts.categories >= 20 ? '✅' : '❌'} (${counts.categories})`);
  console.log(`- Arrematantes com pagamento (>= 100): ${counts.wins >= 100 ? '✅' : '❌'} (${counts.wins})`);
  console.log('=====================================================');
  
  await prisma.$disconnect();
}

checkCounts().catch(e => {
  console.error(e);
  process.exit(1);
});