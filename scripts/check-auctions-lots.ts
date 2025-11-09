import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAuctionsAndLots() {
  try {
    console.log('=== Verificando Leilões ===');
    const auctions = await prisma.auction.findMany({
      include: {
        _count: {
          select: { lots: true }
        },
        stages: true,
        auctioneer: true,
        seller: true,
        lots: {
          select: {
            id: true,
            publicId: true,
            title: true,
            status: true,
            price: true,
            initialPrice: true,
            auctionId: true,
            auction: {
              select: {
                title: true,
                status: true
              }
            },
            assets: {
              select: {
                asset: {
                  select: {
                    id: true,
                    title: true,
                    status: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`Total de leilões: ${auctions.length}`);
    
    auctions.forEach(auction => {
      console.log(`\nLeilão: ${auction.title} (ID: ${auction.id}, Status: ${auction.status})`);
      console.log(`Tipo: ${auction.auctionType}, Método: ${auction.auctionMethod}`);
      console.log(`Data: ${auction.auctionDate} a ${auction.endDate}`);
      console.log(`Total de lotes: ${auction._count.lots}`);
      console.log(`Leiloeiro: ${auction.auctioneer?.name || 'N/A'}`);
      console.log(`Vendedor: ${auction.seller?.name || 'N/A'}`);
      
      if (auction.lots.length > 0) {
        console.log('\nLotes:');
        auction.lots.forEach(lot => {
          console.log(`- ${lot.title} (ID: ${lot.id}, Status: ${lot.status})`);
          console.log(`  Preço: R$ ${lot.price}, Preço Inicial: R$ ${lot.initialPrice}`);
          console.log(`  Ativos associados: ${lot.assets.length}`);
        });
      } else {
        console.log('Nenhum lote encontrado para este leilão.');
      }
    });

    // Verificar lotes sem leilão
    const orphanLots = await prisma.lot.findMany({
      where: {
        auctionId: null
      }
    });

    console.log(`\n=== Lotes sem leilão: ${orphanLots.length} ===`);
    if (orphanLots.length > 0) {
      orphanLots.forEach(lot => {
        console.log(`- ${lot.title} (ID: ${lot.id}, Status: ${lot.status})`);
      });
    }

    // Verificar status dos lotes
    const lotStatusCount = await prisma.lot.groupBy({
      by: ['status'],
      _count: true
    });

    console.log('\n=== Contagem de lotes por status ===');
    lotStatusCount.forEach(status => {
      console.log(`- ${status.status}: ${status._count}`);
    });

    // Verificar lotes que deveriam estar visíveis na home
    const now = new Date();
    const visibleLots = await prisma.lot.findMany({
      where: {
        status: {
          in: ['EM_BREVE', 'ABERTO_PARA_LANCES']
        },
        auction: {
          status: {
            in: ['EM_PREPARACAO', 'EM_BREVE', 'ABERTO', 'ABERTO_PARA_LANCES']
          },
          OR: [
            { auctionDate: { lte: now } },
            { auctionDate: null }
          ],
          AND: [
            { endDate: { gte: now } },
            { endDate: null }
          ]
        }
      },
      include: {
        auction: true
      }
    });

    console.log(`\n=== Lotes que devem estar visíveis na home: ${visibleLots.length} ===`);
    visibleLots.forEach(lot => {
      console.log(`- ${lot.title} (ID: ${lot.id}, Status: ${lot.status})`);
      console.log(`  Leilão: ${lot.auction.title} (Status: ${lot.auction.status})`);
    });

  } catch (error) {
    console.error('Erro ao verificar leilões e lotes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a verificação
checkAuctionsAndLots();
