/**
 * @fileoverview Script para verificar o status das inconsistências de auditoria
 * Verifica todas as métricas que aparecem no Painel de Auditoria de Dados
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAuditStatus() {
  console.log('📊 Verificando Status de Auditoria de Dados...\n');
  
  // 1. Lotes sem Ativos
  const lotsWithoutAssets = await prisma.lot.count({
    where: { assets: { none: {} } }
  });
  console.log(`Lotes sem Ativos: ${lotsWithoutAssets}`);
  
  // 2. Leilões Judiciais sem Processo
  const judicialWithoutProcess = await prisma.auction.count({
    where: { auctionType: 'JUDICIAL', judicialProcessId: null }
  });
  console.log(`Leilões Judiciais s/ Processo: ${judicialWithoutProcess}`);
  
  // 3. Leilões sem Responsáveis
  const auctionsWithoutAuctioneer = await prisma.auction.count({
    where: { auctioneerId: null }
  });
  console.log(`Leilões sem Responsáveis: ${auctionsWithoutAuctioneer}`);
  
  // 4. Ativos sem Imagem
  const assetsWithoutImage = await prisma.asset.count({
    where: { gallery: { none: {} } }
  });
  console.log(`Ativos sem Imagem: ${assetsWithoutImage}`);
  
  // 5. Usuários Habilitados sem Docs
  const habilitatedUserIds = await prisma.auctionHabilitation.findMany({
    select: { userId: true },
    distinct: ['userId']
  });
  let usersWithoutDocs = 0;
  for (const { userId } of habilitatedUserIds) {
    const docCount = await prisma.userDocument.count({ where: { userId } });
    if (docCount === 0) usersWithoutDocs++;
  }
  console.log(`Usuários Habilitados sem Docs: ${usersWithoutDocs}`);
  
  console.log('\n=== Tabelas Incrementadas ===');
  console.log(`LotQuestions: ${await prisma.lotQuestion.count()}`);
  console.log(`Reviews: ${await prisma.review.count()}`);
  console.log(`DirectSaleOffers: ${await prisma.directSaleOffer.count()}`);
  console.log(`Subscribers: ${await prisma.subscriber.count()}`);
  console.log(`Notifications: ${await prisma.notification.count()}`);
  console.log(`ContactMessages: ${await prisma.contactMessage.count()}`);
  console.log(`AuditLogs: ${await prisma.auditLog.count()}`);
  console.log(`BidderProfiles: ${await prisma.bidderProfile.count()}`);
  console.log(`Courts: ${await prisma.court.count()}`);
  console.log(`Sellers: ${await prisma.seller.count()}`);
  console.log(`DocumentTemplates: ${await prisma.documentTemplate.count()}`);
  
  // Resumo de inconsistências
  const totalInconsistencies = lotsWithoutAssets + judicialWithoutProcess + 
    auctionsWithoutAuctioneer + assetsWithoutImage + usersWithoutDocs;
  
  console.log('\n=== RESUMO ===');
  if (totalInconsistencies === 0) {
    console.log('✅ Todas as inconsistências principais foram corrigidas!');
  } else {
    console.log(`⚠️ ${totalInconsistencies} inconsistências ainda pendentes`);
  }
  
  await prisma.$disconnect();
}

verifyAuditStatus().catch(console.error);
