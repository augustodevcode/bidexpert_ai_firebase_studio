import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countRecords(modelName: string, modelFn: any) {
  try {
    const count = await modelFn.count();
    return { model: modelName, count, error: null };
  } catch (error: any) {
    return { model: modelName, count: 0, error: error.message };
  }
}

async function verifySeedData() {
  console.log('🔍 Verificando dados do seed...\n');

  try {
    const results = await Promise.all([
      // Dados principais
      countRecords('Tenant', prisma.tenant),
      countRecords('User', prisma.user),
      countRecords('Role', prisma.role),
      countRecords('Auction', prisma.auction),
      countRecords('Lot', prisma.lot),
      countRecords('Bid', prisma.bid),
      countRecords('JudicialProcess', prisma.judicialProcess),
      countRecords('JudicialParty', prisma.judicialParty),
      countRecords('Asset', prisma.asset),
      countRecords('AuctionHabilitation', prisma.auctionHabilitation),

      // Novos dados
      countRecords('PlatformSettings', prisma.platformSettings),
      countRecords('LotCategory', prisma.lotCategory),
      countRecords('Subcategory', prisma.subcategory),
      countRecords('DirectSaleOffer', prisma.directSaleOffer),
      countRecords('BidderProfile', prisma.bidderProfile),
      countRecords('PaymentMethod', prisma.paymentMethod),
      countRecords('ParticipationHistory', prisma.participationHistory),
      countRecords('BidderNotification', prisma.bidderNotification),
      countRecords('UserWin', prisma.userWin),
      countRecords('WonLot', prisma.wonLot),
      countRecords('InstallmentPayment', prisma.installmentPayment),
      countRecords('ITSM_Ticket', prisma.iTSM_Ticket),
      countRecords('ITSM_Message', prisma.iTSM_Message),
      countRecords('Review', prisma.review),
      countRecords('LotQuestion', prisma.lotQuestion),
      countRecords('AuditLog', prisma.auditLog),
      countRecords('Notification', prisma.notification),
    ]);

    console.log('📊 RESUMO DOS DADOS NO BANCO\n');
    console.log('=== DADOS PRINCIPAIS (Original) ===');
    results.slice(0, 10).forEach(r => {
      if (r.error) {
        console.log(`✗ ${r.model}: ERRO - ${r.error}`);
      } else {
        console.log(`✓ ${r.model}: ${r.count}`);
      }
    });

    console.log('\n=== NOVOS DADOS ADICIONADOS ===');
    results.slice(10).forEach(r => {
      if (r.error) {
        console.log(`✗ ${r.model}: ERRO - ${r.error}`);
      } else {
        console.log(`✓ ${r.model}: ${r.count}`);
      }
    });

    // Verificar se alguma tabela crítica está vazia
    const emptyTables = results.filter(r => !r.error && r.count === 0 &&
      ['PlatformSettings', 'LotCategory', 'DirectSaleOffer', 'BidderProfile', 'ITSM_Ticket'].includes(r.model)
    );

    console.log('\n');
    if (emptyTables.length > 0) {
      console.log('⚠️  ATENÇÃO: As seguintes tabelas críticas estão vazias:');
      emptyTables.forEach(r => console.log(`   - ${r.model}`));
    } else {
      console.log('🎉 Todas as tabelas esperadas contêm dados!');
    }

    // Mostrar erros se houver
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.log('\n❌ Erros encontrados:');
      errors.forEach(r => console.log(`   - ${r.model}: ${r.error}`));
    }

    console.log('\n✅ Verificação concluída!\n');

  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifySeedData()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
