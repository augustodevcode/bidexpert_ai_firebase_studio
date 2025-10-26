
/**
 * @fileoverview Este script popula o banco de dados com cenários avançados para testes e demonstração,
 * incluindo leilões com múltiplos estágios e lotes em diversos estados de pagamento e venda.
 */
import { PrismaClient, AuctionStatus, LotStatus, PaymentStatus, Tenant, User, Seller, Auctioneer } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seed de cenários avançados...');

  // 1. Criar ou obter entidades base (Tenant, User, Seller, Auctioneer)
  let tenant = await prisma.tenant.findUnique({ where: { subdomain: 'advanced-seed' } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Tenant de Cenários Avançados',
        subdomain: 'advanced-seed',
        domain: 'advanced.localhost',
      },
    });
  }

  let winnerUser = await prisma.user.findUnique({ where: { email: 'winner@test.com' } });
  if (!winnerUser) {
    winnerUser = await prisma.user.create({
      data: {
        email: 'winner@test.com',
        fullName: 'Arrematante Teste',
        password: 'password', // Lembre-se de hashear senhas em produção
        habilitationStatus: 'HABILITADO',
      },
    });
  }
  
  let anotherWinner = await prisma.user.findUnique({ where: { email: 'winner2@test.com' } });
    if (!anotherWinner) {
        anotherWinner = await prisma.user.create({
        data: {
            email: 'winner2@test.com',
            fullName: 'Arrematante Teste 2',
            password: 'password',
            habilitationStatus: 'HABILITADO',
        },
        });
    }

  let seller = await prisma.seller.findFirst({ where: { tenantId: tenant.id } });
  if (!seller) {
    seller = await prisma.seller.create({
      data: {
        name: 'Vendedor de Cenários Avançados',
        publicId: faker.string.uuid(),
        slug: 'vendedor-avancado',
        tenantId: tenant.id,
      },
    });
  }

  let auctioneer = await prisma.auctioneer.findFirst({ where: { tenantId: tenant.id } });
  if (!auctioneer) {
    auctioneer = await prisma.auctioneer.create({
      data: {
        name: 'Leiloeiro de Cenários Avançados',
        publicId: faker.string.uuid(),
        slug: 'leiloeiro-avancado',
        tenantId: tenant.id,
      },
    });
  }

  // 2. Criar um Leilão com Múltiplos Estágios
  const today = new Date();
  const auction = await prisma.auction.create({
    data: {
      title: 'Leilão de Demonstração com Estágios',
      status: AuctionStatus.ABERTO_PARA_LANCES,
      auctionDate: faker.date.past({ years: 1 }),
      endDate: faker.date.future({ years: 1 }),
      tenantId: tenant.id,
      sellerId: seller.id,
      auctioneerId: auctioneer.id,
      stages: {
        create: [
          {
            name: '1º Pregão',
            startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 semana atrás
            endDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),   // 1 dia atrás
          },
          {
            name: '2º Pregão',
            startDate: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // Amanhã
            endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),   // 1 semana a partir de hoje
          },
        ],
      },
    },
  });

  console.log(`Leilão criado: ${auction.title} (ID: ${auction.id})`);

  // 3. Criar Lotes com diferentes cenários

  // Cenário 1: Lote Vendido e Pago
  const lotPaid = await prisma.lot.create({
    data: {
      title: 'Lote 101: Vendido e Pago',
      number: '101',
      status: LotStatus.VENDIDO,
      price: 1500.00,
      initialPrice: 1400.00,
      auctionId: auction.id,
      tenantId: tenant.id,
      type: 'VEHICLE',
      winnerId: winnerUser.id,
      bids: {
        create: {
          amount: 1500.00,
          bidderId: winnerUser.id,
          auctionId: auction.id,
          tenantId: tenant.id,
        }
      },
      userWins: {
        create: {
          userId: winnerUser.id,
          winningBidAmount: 1500.00,
          paymentStatus: PaymentStatus.PAGO,
        }
      }
    },
  });
  console.log(`- Lote criado: ${lotPaid.title} (Status: VENDIDO, Pagamento: PAGO)`);

  // Cenário 2: Lote Vendido, Aguardando Pagamento
  const lotPending = await prisma.lot.create({
    data: {
      title: 'Lote 102: Vendido, Aguardando Pagamento',
      number: '102',
      status: LotStatus.VENDIDO,
      price: 2500.00,
      initialPrice: 2300.00,
      auctionId: auction.id,
      tenantId: tenant.id,
      type: 'REAL_ESTATE',
      winnerId: anotherWinner.id,
      bids: {
        create: {
          amount: 2500.00,
          bidderId: anotherWinner.id,
          auctionId: auction.id,
          tenantId: tenant.id,
        }
      },
      userWins: {
        create: {
          userId: anotherWinner.id,
          winningBidAmount: 2500.00,
          paymentStatus: PaymentStatus.PENDENTE,
        }
      }
    },
  });
  console.log(`- Lote criado: ${lotPending.title} (Status: VENDIDO, Pagamento: PENDENTE)`);

  // Cenário 3: Lote Não Vendido
  const lotUnsold = await prisma.lot.create({
    data: {
      title: 'Lote 103: Não Vendido',
      number: '103',
      status: LotStatus.NAO_VENDIDO,
      price: 500.00,
      initialPrice: 500.00,
      auctionId: auction.id,
      tenantId: tenant.id,
      type: 'ELECTRONICS',
    },
  });
  console.log(`- Lote criado: ${lotUnsold.title} (Status: NAO_VENDIDO)`);
  
    // Cenário 4: Lote em aberto para lances
  const lotOpen = await prisma.lot.create({
    data: {
      title: 'Lote 104: Aberto para Lances',
      number: '104',
      status: LotStatus.ABERTO_PARA_LANCES,
      price: 800.00,
      initialPrice: 750.00,
      auctionId: auction.id,
      tenantId: tenant.id,
      type: 'OTHER',
    },
  });
  console.log(`- Lote criado: ${lotOpen.title} (Status: ABERTO_PARA_LANCES)`);


  console.log('Seed de cenários avançados concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
