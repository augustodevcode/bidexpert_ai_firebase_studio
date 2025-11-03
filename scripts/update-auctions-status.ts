// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Atualizando status de leilões e lotes...');

  try {
    // 1. Atualizar leilões para 'FINALIZADO' sem modificar as datas
    const updatedAuctions = await prisma.auction.updateMany({
      where: {
        status: 'EM_BREVE',
      },
      data: {
        status: 'FINALIZADO',
      },
    });

    console.log(`✅ ${updatedAuctions.count} leilões atualizados para 'FINALIZADO'`);

    // 2. Atualizar lotes para 'ABERTO_PARA_LANCES'
    const updatedLots = await prisma.lot.updateMany({
      where: {
        status: 'EM_BREVE',
      },
      data: {
        status: 'ABERTO_PARA_LANCES',
      },
    });

    console.log(`✅ ${updatedLots.count} lotes atualizados para 'ABERTO_PARA_LANCES'`);

    // 3. Verificar se existem lances nos lotes
    const lots = await prisma.lot.findMany({
      where: {
        status: 'ABERTO_PARA_LANCES',
      },
      include: {
        _count: {
          select: { bids: true }
        }
      },
      take: 100 // Limitar a 100 lotes para não sobrecarregar
    });

    console.log(`\n🔍 Verificando ${lots.length} lotes...`);
    
    let lotsWithBids = 0;
    let lotsWithoutBids = 0;

    for (const lot of lots) {
      if (lot._count.bids === 0) {
        lotsWithoutBids++;
      } else {
        lotsWithBids++;
      }
    }

    console.log(`   • Lotes com lances: ${lotsWithBids}`);
    console.log(`   • Lotes sem lances: ${lotsWithoutBids}`);

    if (lotsWithoutBids > 0) {
      console.log(`\n⚠️  ${lotsWithoutBids} lotes não possuem lances.`);
      console.log('   Criando lances de exemplo...');

      // 4. Criar lances de exemplo para os lotes sem lances
      for (const lot of lots) {
        if (lot._count.bids > 0) continue; // Pular lotes que já têm lances

        // Encontrar um usuário para ser o vencedor
        const user = await prisma.user.findFirst({
          where: {
            roles: {
              some: {
                role: {
                  name: 'BIDDER'
                }
              }
            }
          },
          orderBy: {
            id: 'asc'
          },
          take: 1
        });

        if (user) {
          // Criar 1-3 lances para o lote
          const numBids = Math.floor(Math.random() * 3) + 1;
          let currentBid = Number(lot.price) * 0.9; // Começar com 90% do preço inicial
          
          for (let i = 0; i < numBids; i++) {
            currentBid = currentBid * (1 + (Math.random() * 0.1)); // Aumentar entre 0-10% a cada lance
            
            await prisma.bid.create({
              data: {
                lotId: lot.id,
                auctionId: lot.auctionId,
                bidderId: user.id,
                amount: currentBid,
                bidderDisplay: user.fullName || `Usuário ${user.id}`,
                tenantId: lot.tenantId,
              },
            });
          }
          
          console.log(`   ✅ ${numBids} lances criados para o lote #${lot.id} (Valor final: R$ ${currentBid.toFixed(2)})`);
        } else {
          console.error('   ❌ Nenhum usuário com papel BIDDER encontrado para criar lances.');
        }
      }
    }

    console.log('\n✨ Atualização concluída com sucesso!');
    console.log('   Execute o script de vendas novamente para processar os leilões finalizados.');

  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Erro ao executar atualização:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
