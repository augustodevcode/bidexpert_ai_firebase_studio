/**
 * Script de Migração de Dados Multi-Tenant
 * 
 * Este script popula o campo tenantId em todas as tabelas que foram atualizadas
 * para suportar isolamento multi-tenant completo.
 * 
 * ATENÇÃO: Este script deve ser executado APÓS a migration do schema.
 * 
 * Uso:
 *   npx tsx scripts/migrate-tenantid-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationStats {
  tableName: string;
  recordsUpdated: number;
  errors: number;
}

async function migrateTenantIdData() {
  console.log('🚀 Iniciando migração de dados multi-tenant...\n');
  
  const stats: MigrationStats[] = [];
  
  try {
    // 1. AuctionStage - obter tenantId do Auction
    console.log('📋 Migrando AuctionStage...');
    const auctionStages = await prisma.$queryRaw<any[]>`
      SELECT id, auctionId FROM AuctionStage WHERE tenantId IS NULL
    `;
    let updated = 0;
    for (const stage of auctionStages) {
      const auction = await prisma.auction.findUnique({
        where: { id: stage.auctionId },
        select: { tenantId: true }
      });
      if (auction) {
        await prisma.$executeRaw`
          UPDATE AuctionStage SET tenantId = ${auction.tenantId} WHERE id = ${stage.id}
        `;
        updated++;
      }
    }
    stats.push({ tableName: 'AuctionStage', recordsUpdated: updated, errors: 0 });
    console.log(`✅ AuctionStage: ${updated} registros atualizados\n`);

    // 2. LotStagePrice - obter tenantId do Lot
    console.log('📋 Migrando LotStagePrice...');
    const lotStagePrices = await prisma.$queryRaw<any[]>`
      SELECT id, lotId FROM LotStagePrice WHERE tenantId IS NULL
    `;
    updated = 0;
    for (const price of lotStagePrices) {
      const lot = await prisma.lot.findUnique({
        where: { id: price.lotId },
        select: { tenantId: true }
      });
      if (lot) {
        await prisma.$executeRaw`
          UPDATE LotStagePrice SET tenantId = ${lot.tenantId} WHERE id = ${price.id}
        `;
        updated++;
      }
    }
    stats.push({ tableName: 'LotStagePrice', recordsUpdated: updated, errors: 0 });
    console.log(`✅ LotStagePrice: ${updated} registros atualizados\n`);

    // 3. JudicialParty - obter tenantId do JudicialProcess
    console.log('📋 Migrando JudicialParty...');
    const judicialParties = await prisma.$queryRaw<any[]>`
      SELECT id, processId FROM JudicialParty WHERE tenantId IS NULL
    `;
    updated = 0;
    for (const party of judicialParties) {
      const process = await prisma.judicialProcess.findUnique({
        where: { id: party.processId },
        select: { tenantId: true }
      });
      if (process) {
        await prisma.$executeRaw`
          UPDATE JudicialParty SET tenantId = ${process.tenantId} WHERE id = ${party.id}
        `;
        updated++;
      }
    }
    stats.push({ tableName: 'JudicialParty', recordsUpdated: updated, errors: 0 });
    console.log(`✅ JudicialParty: ${updated} registros atualizados\n`);

    // 4. AssetsOnLots - obter tenantId do Lot (ou Asset)
    console.log('📋 Migrando AssetsOnLots...');
    const assetsOnLots = await prisma.$queryRaw<any[]>`
      SELECT lotId, assetId FROM AssetsOnLots WHERE tenantId IS NULL
    `;
    updated = 0;
    for (const relation of assetsOnLots) {
      const lot = await prisma.lot.findUnique({
        where: { id: relation.lotId },
        select: { tenantId: true }
      });
      if (lot) {
        await prisma.$executeRaw`
          UPDATE AssetsOnLots SET tenantId = ${lot.tenantId} 
          WHERE lotId = ${relation.lotId} AND assetId = ${relation.assetId}
        `;
        updated++;
      }
    }
    stats.push({ tableName: 'AssetsOnLots', recordsUpdated: updated, errors: 0 });
    console.log(`✅ AssetsOnLots: ${updated} registros atualizados\n`);

    // 5. AssetMedia - obter tenantId do Asset
    console.log('📋 Migrando AssetMedia...');
    const assetMedia = await prisma.$queryRaw<any[]>`
      SELECT id, assetId FROM AssetMedia WHERE tenantId IS NULL
    `;
    updated = 0;
    for (const media of assetMedia) {
      const asset = await prisma.asset.findUnique({
        where: { id: media.assetId },
        select: { tenantId: true }
      });
      if (asset) {
        await prisma.$executeRaw`
          UPDATE AssetMedia SET tenantId = ${asset.tenantId} WHERE id = ${media.id}
        `;
        updated++;
      }
    }
    stats.push({ tableName: 'AssetMedia', recordsUpdated: updated, errors: 0 });
    console.log(`✅ AssetMedia: ${updated} registros atualizados\n`);

    // 6. UserWin - obter tenantId do Lot
    console.log('📋 Migrando UserWin...');
    const userWins = await prisma.$queryRaw<any[]>`
      SELECT id, lotId FROM UserWin WHERE tenantId IS NULL
    `;
    updated = 0;
    for (const win of userWins) {
      const lot = await prisma.lot.findUnique({
        where: { id: win.lotId },
        select: { tenantId: true }
      });
      if (lot) {
        await prisma.$executeRaw`
          UPDATE UserWin SET tenantId = ${lot.tenantId} WHERE id = ${win.id}
        `;
        updated++;
      }
    }
    stats.push({ tableName: 'UserWin', recordsUpdated: updated, errors: 0 });
    console.log(`✅ UserWin: ${updated} registros atualizados\n`);

    // 7. InstallmentPayment - obter tenantId do UserWin
    console.log('📋 Migrando InstallmentPayment...');
    const installmentPayments = await prisma.$queryRaw<any[]>`
      SELECT id, userWinId FROM InstallmentPayment WHERE tenantId IS NULL
    `;
    updated = 0;
    for (const payment of installmentPayments) {
      const userWin = await prisma.userWin.findUnique({
        where: { id: payment.userWinId },
        select: { tenantId: true }
      });
      if (userWin) {
        await prisma.$executeRaw`
          UPDATE InstallmentPayment SET tenantId = ${userWin.tenantId} WHERE id = ${payment.id}
        `;
        updated++;
      }
    }
    stats.push({ tableName: 'InstallmentPayment', recordsUpdated: updated, errors: 0 });
    console.log(`✅ InstallmentPayment: ${updated} registros atualizados\n`);

    // 8. UserLotMaxBid - obter tenantId do Lot
    console.log('📋 Migrando UserLotMaxBid...');
    const userLotMaxBids = await prisma.$queryRaw<any[]>`
      SELECT id, lotId FROM UserLotMaxBid WHERE tenantId IS NULL
    `;
    updated = 0;
    for (const maxBid of userLotMaxBids) {
      const lot = await prisma.lot.findUnique({
        where: { id: maxBid.lotId },
        select: { tenantId: true }
      });
      if (lot) {
        await prisma.$executeRaw`
          UPDATE UserLotMaxBid SET tenantId = ${lot.tenantId} WHERE id = ${maxBid.id}
        `;
        updated++;
      }
    }
    stats.push({ tableName: 'UserLotMaxBid', recordsUpdated: updated, errors: 0 });
    console.log(`✅ UserLotMaxBid: ${updated} registros atualizados\n`);

    // 9. AuctionHabilitation - obter tenantId do Auction
    console.log('📋 Migrando AuctionHabilitation...');
    const auctionHabilitations = await prisma.$queryRaw<any[]>`
      SELECT userId, auctionId FROM AuctionHabilitation WHERE tenantId IS NULL
    `;
    updated = 0;
    for (const hab of auctionHabilitations) {
      const auction = await prisma.auction.findUnique({
        where: { id: hab.auctionId },
        select: { tenantId: true }
      });
      if (auction) {
        await prisma.$executeRaw`
          UPDATE AuctionHabilitation SET tenantId = ${auction.tenantId} 
          WHERE userId = ${hab.userId} AND auctionId = ${hab.auctionId}
        `;
        updated++;
      }
    }
    stats.push({ tableName: 'AuctionHabilitation', recordsUpdated: updated, errors: 0 });
    console.log(`✅ AuctionHabilitation: ${updated} registros atualizados\n`);

    // 10. Review - obter tenantId do Lot
    console.log('📋 Migrando Review...');
    const reviews = await prisma.$queryRaw<any[]>`
      SELECT id, lotId FROM Review WHERE tenantId IS NULL
    `;
    updated = 0;
    for (const review of reviews) {
      const lot = await prisma.lot.findUnique({
        where: { id: review.lotId },
        select: { tenantId: true }
      });
      if (lot) {
        await prisma.$executeRaw`
          UPDATE Review SET tenantId = ${lot.tenantId} WHERE id = ${review.id}
        `;
        updated++;
      }
    }
    stats.push({ tableName: 'Review', recordsUpdated: updated, errors: 0 });
    console.log(`✅ Review: ${updated} registros atualizados\n`);

    // 11. LotQuestion - obter tenantId do Lot
    console.log('📋 Migrando LotQuestion...');
    const lotQuestions = await prisma.$queryRaw<any[]>`
      SELECT id, lotId FROM LotQuestion WHERE tenantId IS NULL
    `;
    updated = 0;
    for (const question of lotQuestions) {
      const lot = await prisma.lot.findUnique({
        where: { id: question.lotId },
        select: { tenantId: true }
      });
      if (lot) {
        await prisma.$executeRaw`
          UPDATE LotQuestion SET tenantId = ${lot.tenantId} WHERE id = ${question.id}
        `;
        updated++;
      }
    }
    stats.push({ tableName: 'LotQuestion', recordsUpdated: updated, errors: 0 });
    console.log(`✅ LotQuestion: ${updated} registros atualizados\n`);

    // 12. WonLot - obter tenantId via lotId (buscar no Lot)
    console.log('📋 Migrando WonLot...');
    const wonLots = await prisma.$queryRaw<any[]>`
      SELECT id, lotId FROM won_lots WHERE tenantId IS NULL
    `;
    updated = 0;
    for (const wonLot of wonLots) {
      const lot = await prisma.lot.findUnique({
        where: { id: wonLot.lotId },
        select: { tenantId: true }
      });
      if (lot) {
        await prisma.$executeRaw`
          UPDATE won_lots SET tenantId = ${lot.tenantId} WHERE id = ${wonLot.id}
        `;
        updated++;
      }
    }
    stats.push({ tableName: 'WonLot', recordsUpdated: updated, errors: 0 });
    console.log(`✅ WonLot: ${updated} registros atualizados\n`);

    // 13. ParticipationHistory - obter tenantId via lotId
    console.log('📋 Migrando ParticipationHistory...');
    const participationHistory = await prisma.$queryRaw<any[]>`
      SELECT id, lotId FROM participation_history WHERE tenantId IS NULL
    `;
    updated = 0;
    for (const history of participationHistory) {
      const lot = await prisma.lot.findUnique({
        where: { id: history.lotId },
        select: { tenantId: true }
      });
      if (lot) {
        await prisma.$executeRaw`
          UPDATE participation_history SET tenantId = ${lot.tenantId} WHERE id = ${history.id}
        `;
        updated++;
      }
    }
    stats.push({ tableName: 'ParticipationHistory', recordsUpdated: updated, errors: 0 });
    console.log(`✅ ParticipationHistory: ${updated} registros atualizados\n`);

    // 14. MediaItem - tenantId nullable, obter do judicialProcess se existir
    console.log('📋 Migrando MediaItem (nullable)...');
    const mediaItems = await prisma.$queryRaw<any[]>`
      SELECT id, judicialProcessId FROM MediaItem WHERE judicialProcessId IS NOT NULL AND tenantId IS NULL
    `;
    updated = 0;
    for (const item of mediaItems) {
      const process = await prisma.judicialProcess.findUnique({
        where: { id: item.judicialProcessId },
        select: { tenantId: true }
      });
      if (process) {
        await prisma.$executeRaw`
          UPDATE MediaItem SET tenantId = ${process.tenantId} WHERE id = ${item.id}
        `;
        updated++;
      }
    }
    stats.push({ tableName: 'MediaItem', recordsUpdated: updated, errors: 0 });
    console.log(`✅ MediaItem: ${updated} registros atualizados (nullable)\n`);

    // Imprimir resumo
    console.log('\n📊 RESUMO DA MIGRAÇÃO\n');
    console.log('═'.repeat(60));
    stats.forEach(stat => {
      console.log(`${stat.tableName.padEnd(30)} ${stat.recordsUpdated} registros`);
    });
    console.log('═'.repeat(60));
    const totalRecords = stats.reduce((sum, stat) => sum + stat.recordsUpdated, 0);
    console.log(`TOTAL: ${totalRecords} registros atualizados`);
    console.log('\n✅ Migração concluída com sucesso!\n');
    
  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateTenantIdData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
