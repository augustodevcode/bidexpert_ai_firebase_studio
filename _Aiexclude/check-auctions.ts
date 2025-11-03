import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando status dos leilões e lotes...\n');

  try {
    // Verificar contagem total de leilões por status
    const auctionsByStatus = await prisma.auction.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    console.log('📊 Total de leilões por status:');
    console.table(auctionsByStatus.map(a => ({
      status: a.status,
      count: a._count._all
    })));

    // Verificar contagem total de lotes por status
    const lotsByStatus = await prisma.lot.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    console.log('\n📦 Total de lotes por status:');
    console.table(lotsByStatus.map(l => ({
      status: l.status,
      count: l._count._all
    })));

    // Verificar se existem leilões finalizados com lotes
    const finishedAuctions = await prisma.auction.findMany({
      where: {
        status: 'FINALIZADO',
      },
      include: {
        _count: {
          select: { lots: true }
        }
      }
    });

    console.log('\n🏁 Leilões finalizados encontrados:', finishedAuctions.length);
    
    if (finishedAuctions.length > 0) {
      console.log('\nDetalhes dos leilões finalizados:');
      console.table(finishedAuctions.map(a => ({
        id: a.id,
        title: a.title,
        status: a.status,
        totalLotes: a._count.lots,
        startDate: a.startDate?.toISOString().split('T')[0],
        endDate: a.endDate?.toISOString().split('T')[0]
      })));
    }

    // Verificar lotes em leilões finalizados
    const lotsInFinishedAuctions = await prisma.lot.findMany({
      where: {
        auction: {
          status: 'FINALIZADO'
        }
      },
      select: {
        id: true,
        status: true,
        auctionId: true,
        _count: {
          select: { bids: true }
        }
      },
      orderBy: {
        auctionId: 'asc'
      }
    });

    console.log('\n📋 Lotes em leilões finalizados:', lotsInFinishedAuctions.length);
    
    if (lotsInFinishedAuctions.length > 0) {
      console.log('\nDetalhes dos lotes:');
      console.table(lotsInFinishedAuctions.map(l => ({
        id: l.id,
        auctionId: l.auctionId,
        status: l.status,
        totalBids: l._count.bids
      })));
    }

  } catch (error) {
    console.error('❌ Erro ao verificar o banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Erro ao executar verificação:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
