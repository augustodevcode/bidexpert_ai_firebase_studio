/**
 * @fileoverview Script para verificar inconsistências de dados e tabelas vazias
 * Não modifica dados, apenas reporta o status atual
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  const tables = [
    'lot', 'asset', 'assetMedia', 'auction', 'auctionStage', 'lotStagePrice',
    'judicialProcess', 'auctioneer', 'auctionHabilitation', 'userDocument',
    'bid', 'userWin', 'wonLot', 'payment', 'installmentPayment',
    'lotQuestion', 'review', 'directSaleOffer', 'participationHistory',
    'subscriber', 'notification', 'contactMessage', 'bidderNotification',
    'sellerChat', 'sellerChatMessage', 'auditLog', 'visitor', 'visitorSession',
    'lotRisk', 'lotDocument', 'documentType', 'documentTemplate', 'processParty',
    'lotCategory', 'subcategory', 'vehicleMake', 'vehicleModel', 'seller',
    'court', 'judicialDistrict', 'judicialBranch', 'bidderProfile'
  ];
  
  console.log('📊 Contagem de registros por tabela:\n');
  const emptyTables: string[] = [];
  const lowDataTables: string[] = [];
  
  for (const table of tables) {
    try {
      const model = (prisma as any)[table];
      if (model) {
        const count = await model.count();
        const status = count === 0 ? '❌ VAZIA' : count < 5 ? '⚠️ POUCO' : '✅';
        console.log(`${status} ${table.padEnd(25)} ${count}`);
        if (count === 0) emptyTables.push(table);
        else if (count < 5) lowDataTables.push(table);
      }
    } catch (e: any) {
      console.log(`❓ ${table.padEnd(25)} Erro: ${e.message?.substring(0,50)}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 INCONSISTÊNCIAS ESPECÍFICAS:\n');
  
  // Lotes sem Ativos
  const lotsWithoutAssets = await prisma.lot.findMany({ 
    where: { assets: { none: {} } },
    select: { id: true, number: true, title: true }
  });
  console.log(`❌ Lotes sem Ativos: ${lotsWithoutAssets.length}`);
  if (lotsWithoutAssets.length > 0) {
    lotsWithoutAssets.slice(0, 5).forEach(l => console.log(`   - Lote ${l.id}: ${l.number}`));
  }
  
  // Leilões Judiciais sem Processo
  const judicialWithoutProcess = await prisma.auction.findMany({ 
    where: { type: 'JUDICIAL', judicialProcessId: null },
    select: { id: true, title: true }
  });
  console.log(`❌ Leilões Judiciais sem Processo: ${judicialWithoutProcess.length}`);
  judicialWithoutProcess.forEach(a => console.log(`   - Leilão ${a.id}: ${a.title}`));
  
  // Leilões sem Responsáveis
  const auctionsWithoutResponsible = await prisma.auction.findMany({
    where: { responsibleAuctioneerId: null },
    select: { id: true, title: true }
  });
  console.log(`❌ Leilões sem Responsáveis: ${auctionsWithoutResponsible.length}`);
  auctionsWithoutResponsible.forEach(a => console.log(`   - Leilão ${a.id}: ${a.title}`));
  
  // Ativos/Itens sem Imagem
  const assetsWithoutImage = await prisma.asset.findMany({
    where: { media: { none: {} } },
    select: { id: true, title: true }
  });
  console.log(`❌ Ativos sem Imagem: ${assetsWithoutImage.length}`);
  assetsWithoutImage.slice(0, 5).forEach(a => console.log(`   - Asset ${a.id}: ${a.title}`));
  
  // Usuários habilitados sem documentos
  const habilitationsWithoutDocs = await prisma.auctionHabilitation.findMany({
    where: { 
      status: 'APROVADA',
      user: { documents: { none: {} } }
    },
    select: { id: true, userId: true, user: { select: { email: true } } }
  });
  console.log(`❌ Habilitações aprovadas sem docs: ${habilitationsWithoutDocs.length}`);
  habilitationsWithoutDocs.forEach(h => console.log(`   - Habilitação ${h.id}: ${h.user.email}`));
  
  // Lotes sem LotStagePrice
  const lotsWithoutPrice = await prisma.lot.findMany({
    where: { lotPrices: { none: {} } },
    select: { id: true, number: true }
  });
  console.log(`❌ Lotes sem LotStagePrice: ${lotsWithoutPrice.length}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('📝 RESUMO:\n');
  console.log(`Tabelas VAZIAS (${emptyTables.length}): ${emptyTables.join(', ')}`);
  console.log(`Tabelas com POUCOS dados (${lowDataTables.length}): ${lowDataTables.join(', ')}`);
  
  await prisma.$disconnect();
}

checkTables().catch(console.error);
