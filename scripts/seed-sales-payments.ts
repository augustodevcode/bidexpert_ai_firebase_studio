import { PrismaClient, Prisma, PaymentStatus, PaymentMethodType, AuctionStatus, LotStatus } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Configuração do Faker
faker.seed(123);

async function seedSalesAndPayments() {
  console.log('🚀 Iniciando seed de Vendas e Pagamentos...');
  
  try {
    // Busca leilões finalizados ou em andamento
    const auctions = await prisma.auction.findMany({
      where: {
        status: {
          in: ['EM_ANDAMENTO', 'FINALIZADO', 'EM_LEILAO']
        }
      },
      include: {
        lots: {
          include: {
            bids: {
              orderBy: {
                amount: 'desc'
              },
              take: 1
            },
            assets: true
          },
          where: {
            status: 'VENDIDO' as const
          }
        }
      }
    });

    if (auctions.length === 0) {
      console.log('⚠️ Nenhum leilão encontrado com lotes vendidos. Atualizando status dos leilões e lotes primeiro...');
      
      // Atualiza o status dos leilões para FINALIZADO
      await prisma.auction.updateMany({
        where: {
          endDate: {
            lt: new Date()
          },
          status: 'EM_BREVE'
        },
        data: {
          status: 'FINALIZADO'
        }
      });

      // Atualiza o status dos lotes para VENDIDO para os lotes com lances
      const lotsWithBids = await prisma.lot.findMany({
        where: {
          bids: {
            some: {}
          },
          status: 'EM_LEILAO'
        },
        include: {
          bids: {
            orderBy: {
              amount: 'desc'
            },
            take: 1
          }
        }
      });

      for (const lot of lotsWithBids) {
        if (lot.bids.length > 0) {
          const winningBid = lot.bids[0];
          
          // Atualiza o status do lote para VENDIDO
          await prisma.lot.update({
            where: { id: lot.id },
            data: {
              status: 'VENDIDO' as const,
              winningBidId: winningBid.id,
              winningBidAmount: winningBid.amount,
              winningBidderId: winningBid.bidderId,
              soldAt: new Date()
            }
          });

          console.log(`✅ Lote ${lot.id} marcado como VENDIDO para o usuário ${winningBid.bidderId} por R$ ${winningBid.amount}`);
        }
      }

      // Busca novamente os leilões atualizados
      const updatedAuctions = await prisma.auction.findMany({
        where: {
          status: 'FINALIZADO',
          lots: {
            some: {
              status: 'VENDIDO' as const
            }
          }
        },
        include: {
          lots: {
            include: {
              bids: {
                orderBy: {
                  amount: 'desc'
                },
                take: 1,
                include: {
                  bidder: true
                }
              },
              assets: true
            },
            where: {
              status: 'VENDIDO' as const
            }
          }
        }
      });

      if (updatedAuctions.length === 0) {
        throw new Error('Nenhum lote vendido encontrado após atualização. É necessário ter leilões finalizados com lances para criar vendas.');
      }

      return await processSales(updatedAuctions);
    }

    return await processSales(auctions);
  } catch (error) {
    console.error('❌ Erro durante o seed de Vendas e Pagamentos:', error);
    throw error;
  }
}

async function processSales(auctions: any[]): Promise<{ totalSales: number; totalPayments: number }> {
  let totalSales = 0;
  let totalPayments = 0;

  for (const auction of auctions) {
    console.log(`\n💼 Processando leilão: ${auction.title} (${auction.status})`);
    
    for (const lot of auction.lots) {
      if (lot.bids.length === 0) {
        console.log(`   ⚠️ Lote ${lot.id} não tem lances, pulando...`);
        continue;
      }

      const winningBid = lot.bids[0];
      const bidder = winningBid.bidder;
      
      console.log(`   💰 Lote ${lot.id} vendido para ${bidder.fullName || bidder.email} por R$ ${winningBid.amount}`);

      // Cria um registro de venda (usando o modelo Lot para armazenar as informações)
      const updatedLot = await prisma.lot.update({
        where: { id: lot.id },
        data: {
          status: 'VENDIDO' as const,
          winnerId: bidder.id,
          salePrice: winningBid.amount,
          soldAt: new Date(),
          // Adiciona informações adicionais
          paymentStatus: 'PENDENTE' as const,
          paymentMethod: faker.helpers.arrayElement([
            'CREDIT_CARD', 
            'PIX', 
            'BOLETO',
            'TRANSFERENCIA_BANCARIA'
          ]) as PaymentMethodType,
          // Atualiza a descrição para incluir informações da venda
          description: `${lot.description || ''}\n\nVENDIDO PARA: ${bidder.fullName || bidder.email}\nVALOR: R$ ${winningBid.amount.toFixed(2)}`
        },
        include: {
          winner: true
        }
      });

      console.log(`   ✅ Venda registrada para o lote ${lot.id} por R$ ${winningBid.amount}`);

      console.log(`   ✅ Venda criada: ${sale.publicId}`);
      totalSales++;

      // Cria um registro de pagamento (80% de chance)
      if (Math.random() < 0.8) {
        const paymentStatus: PaymentStatus = Math.random() > 0.1 ? 'PAGO' : 'PENDENTE';
        const paymentMethod = faker.helpers.arrayElement([
          'CREDIT_CARD', 
          'PIX', 
          'BOLETO',
          'TRANSFERENCIA_BANCARIA'
        ]) as PaymentMethodType;

        // Atualiza o lote com as informações de pagamento
        await prisma.lot.update({
          where: { id: lot.id },
          data: {
            paymentStatus: paymentStatus as any, // Usando 'as any' para evitar erros de tipo
            paymentMethod: paymentMethod,
            paidAt: paymentStatus === 'PAGO' ? new Date() : null,
            paymentDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias para pagamento
            // Atualiza a descrição para incluir informações de pagamento
            description: `${updatedLot.description || ''}\n\nMÉTODO DE PAGAMENTO: ${paymentMethod}\nSTATUS: ${paymentStatus}`
          }
        });

        console.log(`   💳 Pagamento registrado para o lote ${lot.id}: ${paymentStatus} via ${paymentMethod}`);
        totalPayments++;
      } else {
        console.log(`   ⏳ Pagamento não registrado para o lote ${lot.id} (20% de chance)`);
      }
    }
  }

  return { totalSales, totalPayments };
}

async function main() {
  console.log('🚀 Iniciando seed de Vendas e Pagamentos...');
  
  try {
    const result = await seedSalesAndPayments();
    const totalSales = result?.totalSales || 0;
    const totalPayments = result?.totalPayments || 0;
    console.log('\n✨ Seed de Vendas e Pagamentos concluído com sucesso!');
    console.log(`✅ Total de vendas criadas: ${totalSales}`);
    console.log(`✅ Total de pagamentos processados: ${totalPayments}`);
  } catch (error) {
    console.error('\n❌ Ocorreu um erro durante o seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executa o seed
main();
