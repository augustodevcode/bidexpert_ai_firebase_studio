/**
 * seed-fill-remaining-nulls.ts
 * Fills the remaining 25 all-null columns identified by the audit.
 * Run after seed-fill-all-gaps.ts.
 */
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('============================================================');
  console.log('🔧 FILLING REMAINING 25 NULL COLUMNS');
  console.log('============================================================\n');

  // Get reference data
  const mediaItems = await prisma.mediaItem.findMany({ select: { id: true }, take: 20 });
  const states = await prisma.state.findMany({ select: { id: true } });
  const users = await prisma.user.findMany({ select: { id: true }, take: 5 });

  if (!mediaItems.length) throw new Error('No MediaItems found');
  if (!states.length) throw new Error('No States found');
  if (!users.length) throw new Error('No Users found');

  const mediaId = (i: number) => mediaItems[i % mediaItems.length].id;
  const stateId = (i: number) => states[i % states.length].id;
  const userId = (i: number) => users[i % users.length].id;

  // 1. Asset.engineType - fill vehicle assets
  console.log('📝 1/25 Asset.engineType...');
  const assets = await prisma.asset.findMany({
    where: { engineType: null },
    select: { id: true },
  });
  const engineTypes = ['1.0 Flex', '1.6 Turbo', '2.0 TSI', '1.5 Hybrid', '3.0 V6', '2.0 Diesel', '1.3 Firefly', '1.4 T-Jet'];
  for (let i = 0; i < assets.length; i++) {
    await prisma.asset.update({
      where: { id: assets[i].id },
      data: { engineType: engineTypes[i % engineTypes.length] },
    });
  }
  console.log(`  ✅ Filled ${assets.length} Asset.engineType`);

  // 2-4. Auction.cancelledAt/cancelledBy/cancellationReason - mark ~10 auctions
  console.log('📝 2-4/25 Auction cancel fields...');
  const auctions = await prisma.auction.findMany({
    where: { cancelledAt: null },
    select: { id: true },
    take: 10,
  });
  const cancelReasons = [
    'Determinação judicial suspendeu o leilão',
    'Acordo entre as partes antes da hasta',
    'Vício no edital identificado',
    'Imóvel penhorado em outro processo',
    'Desistência do exequente',
    'Pagamento integral do débito pelo executado',
    'Recurso provido pelo Tribunal',
    'Erro na avaliação do bem',
    'Impedimento legal superveniente',
    'Solicitação do juízo de origem',
  ];
  for (let i = 0; i < auctions.length; i++) {
    await prisma.auction.update({
      where: { id: auctions[i].id },
      data: {
        cancelledAt: new Date(2025, 0, 15 + i),
        cancelledBy: userId(i),
        cancellationReason: cancelReasons[i % cancelReasons.length],
      },
    });
  }
  console.log(`  ✅ Filled ${auctions.length} Auction cancel fields`);

  // 5. Auction.originalAuctionId - self-reference for re-auctions (unique)
  console.log('📝 5/25 Auction.originalAuctionId...');
  const allAuctions = await prisma.auction.findMany({
    where: { originalAuctionId: null },
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  // Pick pairs: auction[i] references auction[i+1] as original
  let reAuctionCount = 0;
  for (let i = 0; i < Math.min(10, allAuctions.length - 1); i += 2) {
    try {
      await prisma.auction.update({
        where: { id: allAuctions[i].id },
        data: { originalAuctionId: allAuctions[i + 1].id },
      });
      reAuctionCount++;
    } catch { /* unique constraint - skip */ }
  }
  console.log(`  ✅ Filled ${reAuctionCount} Auction.originalAuctionId`);

  // 6. Bid.cancelledAt - mark ~15 bids as cancelled
  console.log('📝 6/25 Bid.cancelledAt...');
  const bids = await prisma.bid.findMany({
    where: { cancelledAt: null },
    select: { id: true },
    take: 15,
  });
  for (let i = 0; i < bids.length; i++) {
    await prisma.bid.update({
      where: { id: bids[i].id },
      data: { cancelledAt: new Date(2025, 1, 1 + i) },
    });
  }
  console.log(`  ✅ Filled ${bids.length} Bid.cancelledAt`);

  // 7. DirectSaleOffer.imageMediaId
  console.log('📝 7/25 DirectSaleOffer.imageMediaId...');
  const offers = await prisma.directSaleOffer.findMany({
    where: { imageMediaId: null },
    select: { id: true },
  });
  for (let i = 0; i < offers.length; i++) {
    await prisma.directSaleOffer.update({
      where: { id: offers[i].id },
      data: { imageMediaId: mediaId(i) },
    });
  }
  console.log(`  ✅ Filled ${offers.length} DirectSaleOffer.imageMediaId`);

  // 8-9. InstallmentPayment.paymentDate/transactionId
  console.log('📝 8-9/25 InstallmentPayment payment fields...');
  const installments = await prisma.installmentPayment.findMany({
    where: { paymentDate: null },
    select: { id: true },
  });
  for (let i = 0; i < installments.length; i++) {
    await prisma.installmentPayment.update({
      where: { id: installments[i].id },
      data: {
        paymentDate: new Date(2025, 2, 1 + i * 3),
        transactionId: `TXN-${Date.now()}-${i.toString().padStart(3, '0')}`,
      },
    });
  }
  console.log(`  ✅ Filled ${installments.length} InstallmentPayment payment fields`);

  // 10-11. Lot.additionalTriggers/stageDetails (Json)
  console.log('📝 10-11/25 Lot JSON fields...');
  const lots = await prisma.lot.findMany({
    where: { additionalTriggers: { equals: Prisma.DbNull } },
    select: { id: true },
  });
  for (let i = 0; i < lots.length; i++) {
    await prisma.lot.update({
      where: { id: lots[i].id },
      data: {
        additionalTriggers: {
          urgencyBanner: i % 3 === 0,
          priceDropAlert: i % 2 === 0,
          viewCountThreshold: 50 + i * 10,
          reminderHoursBefore: [24, 12, 1],
        },
        stageDetails: {
          currentStage: i % 2 === 0 ? '1a_praca' : '2a_praca',
          previousStageResult: i % 3 === 0 ? 'deserto' : 'sem_lance_minimo',
          stageTransitionDate: new Date(2025, 1, 10 + i).toISOString(),
          evaluationNotes: `Avaliação do lote conforme laudo pericial nº ${1000 + i}`,
        },
      },
    });
  }
  console.log(`  ✅ Filled ${lots.length} Lot JSON fields`);

  // 12. Lot.original_lot_id - self-reference (unique)
  console.log('📝 12/25 Lot.original_lot_id...');
  const allLots = await prisma.lot.findMany({
    where: { original_lot_id: { equals: null } },
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  let reLotCount = 0;
  for (let i = 0; i < Math.min(20, allLots.length - 1); i += 2) {
    try {
      await prisma.lot.update({
        where: { id: allLots[i].id },
        data: { original_lot_id: allLots[i + 1].id },
      });
      reLotCount++;
    } catch { /* unique constraint - skip */ }
  }
  console.log(`  ✅ Filled ${reLotCount} Lot.original_lot_id`);

  // 13. Lot.stateId - FK to State
  console.log('📝 13/25 Lot.stateId...');
  const lotsNoState = await prisma.lot.findMany({
    where: { stateId: null },
    select: { id: true },
  });
  for (let i = 0; i < lotsNoState.length; i++) {
    await prisma.lot.update({
      where: { id: lotsNoState[i].id },
      data: { stateId: stateId(i) },
    });
  }
  console.log(`  ✅ Filled ${lotsNoState.length} Lot.stateId`);

  // 14-16. LotCategory media IDs
  console.log('📝 14-16/25 LotCategory media fields...');
  const categories = await prisma.lotCategory.findMany({
    where: { logoMediaId: null },
    select: { id: true },
  });
  for (let i = 0; i < categories.length; i++) {
    await prisma.lotCategory.update({
      where: { id: categories[i].id },
      data: {
        logoMediaId: mediaId(i),
        coverImageMediaId: mediaId(i + 1),
        megaMenuImageMediaId: mediaId(i + 2),
      },
    });
  }
  console.log(`  ✅ Filled ${categories.length} LotCategory media fields`);

  // 17. PlatformSettings.logoMediaId
  console.log('📝 17/25 PlatformSettings.logoMediaId...');
  const ps = await prisma.platformSettings.findFirst({ select: { id: true } });
  if (ps) {
    await prisma.platformSettings.update({
      where: { id: ps.id },
      data: { logoMediaId: mediaId(0) },
    });
    console.log('  ✅ Filled PlatformSettings.logoMediaId');
  }

  // 18. Subcategory.iconMediaId
  console.log('📝 18/25 Subcategory.iconMediaId...');
  const subcats = await prisma.subcategory.findMany({
    where: { iconMediaId: null },
    select: { id: true },
  });
  for (let i = 0; i < subcats.length; i++) {
    await prisma.subcategory.update({
      where: { id: subcats[i].id },
      data: { iconMediaId: mediaId(i) },
    });
  }
  console.log(`  ✅ Filled ${subcats.length} Subcategory.iconMediaId`);

  // 19-20. Tenant.suspendedAt/suspendedReason - create a 2nd tenant that IS suspended
  console.log('📝 19-20/25 Tenant suspended fields...');
  // Create a second tenant with suspended state for coverage
  // Use raw SQL to bypass sequence issues
  await prisma.$executeRaw`
    INSERT INTO "Tenant" (id, name, subdomain, "resolutionStrategy", "customDomainVerified", status, "suspendedAt", "suspendedReason", "createdAt", "updatedAt")
    VALUES (999, 'Tenant Teste Arquivado', 'archived-test', 'SUBDOMAIN', false, 'SUSPENDED',
            ${new Date(2025, 0, 15)}, 'Inadimplência no plano mensal após 3 notificações',
            NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      "suspendedAt" = EXCLUDED."suspendedAt",
      "suspendedReason" = EXCLUDED."suspendedReason"
  `;
  console.log('  ✅ Tenant suspended fields filled');

  // 21-24. TenantInvoice payment fields - mark ~25 as paid
  console.log('📝 21-24/25 TenantInvoice payment fields...');
  const invoices = await prisma.tenantInvoice.findMany({
    where: { paidAt: null },
    select: { id: true },
    take: 25,
  });
  const paymentMethods = ['PIX', 'BOLETO', 'CARTAO_CREDITO', 'TED', 'DEBITO_AUTOMATICO'];
  for (let i = 0; i < invoices.length; i++) {
    await prisma.tenantInvoice.update({
      where: { id: invoices[i].id },
      data: {
        paidAt: new Date(2025, 1, 5 + i),
        paymentMethod: paymentMethods[i % paymentMethods.length],
        paymentReference: `PAG-${2025}${(i + 1).toString().padStart(4, '0')}`,
        receiptUrl: `https://payments.bidexpert.com.br/receipts/${Date.now()}-${i}.pdf`,
      },
    });
  }
  console.log(`  ✅ Filled ${invoices.length} TenantInvoice payment fields`);

  // 25. UserDocument.rejectionReason - mark some as rejected
  console.log('📝 25/25 UserDocument.rejectionReason...');
  const docs = await prisma.userDocument.findMany({
    where: { rejectionReason: null },
    select: { id: true },
    take: 20,
  });
  const reasons = [
    'Documento ilegível - resolução insuficiente',
    'CPF não confere com o cadastro',
    'Documento vencido (validade expirada)',
    'Informações divergentes do cadastro',
    'Foto do documento cortada ou incompleta',
    'Comprovante de endereço com mais de 90 dias',
    'Assinatura não confere',
    'Documento rasurado',
    'Falta verso do documento',
    'CNH fora da validade',
  ];
  for (let i = 0; i < docs.length; i++) {
    await prisma.userDocument.update({
      where: { id: docs[i].id },
      data: {
        rejectionReason: reasons[i % reasons.length],
        status: 'REJECTED',
      },
    });
  }
  console.log(`  ✅ Filled ${docs.length} UserDocument rejection reasons`);

  console.log('\n============================================================');
  console.log('✅ ALL 25 REMAINING NULL COLUMNS FILLED');
  console.log('============================================================');
}

main()
  .catch((e) => { console.error('❌ FATAL:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
