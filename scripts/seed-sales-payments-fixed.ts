// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de vendas e pagamentos...');

  try {
    // 1. Buscar leilões finalizados com lotes
    const finishedAuctions = await prisma.auction.findMany({
      where: {
        status: 'FINALIZADO',
      },
      include: {
        lots: {
          where: {
            status: 'ABERTO_PARA_LANCES', // Apenas lotes que estavam abertos
          },
          include: {
            bids: {
              orderBy: {
                amount: 'desc',
              },
              take: 1, // Pegar apenas o maior lance
              include: {
                bidder: true,
              },
            },
          },
        },
      },
    });

    if (finishedAuctions.length === 0) {
      console.log('ℹ️ Nenhum leilão finalizado encontrado com lotes abertos.');
      return;
    }

    console.log(`🏷️  Encontrados ${finishedAuctions.length} leilões finalizados para processar.`);

    // 2. Processar cada leilão
    for (const auction of finishedAuctions) {
      console.log(`\n📦 Processando leilão #${auction.id} (${auction.title})`);
      
      if (!auction.lots || auction.lots.length === 0) {
        console.log('   ℹ️ Nenhum lote encontrado para este leilão.');
        continue;
      }
      
      console.log(`   Encontrados ${auction.lots.length} lotes para processar.`);

      // 3. Processar cada lote do leilão
      for (const lot of auction.lots) {
        try {
          if (!lot.bids || lot.bids.length === 0) {
            console.log(`   ℹ️ Lote #${lot.id} não teve lances. Pulando...`);
            continue;
          }

          const winningBid = lot.bids[0];
          const salePrice = winningBid.amount;
          
          console.log(`   ✅ Lote #${lot.id} - Vencedor ID: ${winningBid.bidderId} (R$ ${salePrice})`);

          // 4. Atualizar o lote como vendido
          await prisma.lot.update({
            where: { id: lot.id },
            data: {
              status: 'VENDIDO',
              winner: {
                connect: { id: winningBid.bidderId }
              },
              price: salePrice,
              // OBS: paymentStatus e paymentMethod não estão disponíveis diretamente no modelo Lot
              // Essas informações serão armazenadas apenas no registro de UserWin
            },
          });

          // 5. Criar registro de vitória (UserWin)
          await prisma.userWin.create({
            data: {
              lotId: lot.id,
              userId: winningBid.bidderId,
              winningBidAmount: salePrice,
              paymentStatus: 'PENDENTE',
              retrievalStatus: 'PENDENTE',
              winDate: new Date(),
            },
          });

          // 6. Criar pagamento (se necessário)
          const paymentMethod = faker.helpers.arrayElement(['PIX', 'BANK_SLIP', 'CREDIT_CARD', 'BANK_TRANSFER']);
          const paymentStatus = faker.helpers.arrayElement(['PENDENTE', 'PROCESSANDO', 'PAGO', 'ATRASADO']);
          
          await prisma.installmentPayment.create({
            data: {
              lotId: lot.id,
              userId: winningBid.bidderId,
              amount: salePrice,
              dueDate: faker.date.soon({ days: 7 }),
              status: paymentStatus,
              method: paymentMethod,
              installments: 1, // Pagamento à vista
              installmentNumber: 1, // Número da parcela (1 de 1, já que é pagamento à vista)
              paidAt: paymentStatus === 'PAGO' ? new Date() : null,
              tenantId: 1, // Assumindo que existe um tenant com ID 1
            },
          });

          console.log(`   💰 Pagamento criado para o lote #${lot.id} via ${paymentMethod} (Status: ${paymentStatus})`);
        } catch (error) {
          console.error(`   ❌ Erro ao processar lote #${lot.id}:`, error.message);
        }
      }
    }

    console.log('\n✨ Seed de vendas e pagamentos concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o processo de seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
