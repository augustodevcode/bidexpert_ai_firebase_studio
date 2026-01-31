/**
 * Seed de lotes arrematados com arrematantes habilitados e documentação aprovada
 * Gera leilões encerrados, lotes, habilitações, docs e marca vencedores
 */
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';

const prisma = new PrismaClient();

async function main() {
  const tenantId = BigInt(1);
  const NUM_AUCTIONS = 3;
  const LOTS_PER_AUCTION = 5;
  const WINNERS_PER_AUCTION = 4;

  // 1. Seleciona usuários com docs aprovados ou cria se necessário
  let users = await prisma.user.findMany({
    where: {
      tenants: { some: { tenantId } },
      documents: { some: { status: 'APROVADO' } }
    },
    take: 20
  });
  if (users.length < WINNERS_PER_AUCTION * NUM_AUCTIONS) {
    // Cria usuários com docs aprovados
    for (let i = users.length; i < WINNERS_PER_AUCTION * NUM_AUCTIONS; i++) {
      const email = `arrematante${i+1}@seed.com`;
      const user = await prisma.user.create({
        data: {
          email,
          fullName: faker.person.fullName(),
          password: 'Test@12345',
          tenants: { create: { tenantId } },
          documents: {
            create: [{
              type: 'RG',
              status: 'APROVADO',
              fileUrl: faker.internet.url(),
              fileName: 'rg.pdf',
              uploadedAt: new Date(),
            }, {
              type: 'CPF',
              status: 'APROVADO',
              fileUrl: faker.internet.url(),
              fileName: 'cpf.pdf',
              uploadedAt: new Date(),
            }]
          }
        }
      });
      users.push(user);
    }
  }

  // 2. Cria leilões encerrados
  for (let a = 0; a < NUM_AUCTIONS; a++) {
    const auction = await prisma.auction.create({
      data: {
        tenantId,
        title: `Leilão Encerrado Seed #${a+1}`,
        status: 'FINALIZADO',
        startDate: faker.date.past({ years: 1 }),
        endDate: faker.date.recent({ days: 10 }),
        description: 'Seed de leilão encerrado para testes de lotes arrematados',
        type: 'JUDICIAL',
        isActive: false,
      }
    });

    // 3. Cria lotes
    for (let l = 0; l < LOTS_PER_AUCTION; l++) {
      const lot = await prisma.lot.create({
        data: {
          auctionId: auction.id,
          title: `Lote ${l+1} do ${auction.title}`,
          description: 'Lote de seed para arrematação',
          status: 'ARREMATADO',
          initialValue: faker.number.int({ min: 10000, max: 50000 }),
          isActive: false,
        }
      });

      // 4. Seleciona arrematante para o lote
      const winner = users[(a * WINNERS_PER_AUCTION + l) % users.length];

      // 5. Habilita arrematante no leilão/lote
      await prisma.auctionRegistration.create({
        data: {
          auctionId: auction.id,
          userId: winner.id,
          status: 'APROVADO',
          approvedAt: new Date(),
        }
      });
      await prisma.lotRegistration.create({
        data: {
          lotId: lot.id,
          userId: winner.id,
          status: 'APROVADO',
          approvedAt: new Date(),
        }
      });

      // 6. Marca vencedor do lote
      await prisma.lot.update({
        where: { id: lot.id },
        data: {
          winnerId: winner.id,
          status: 'ARREMATADO',
          winningBidValue: faker.number.int({ min: lot.initialValue + 1000, max: lot.initialValue + 10000 }),
          winningBidAt: faker.date.recent({ days: 10 }),
        }
      });
    }
  }

  console.log('✅ Seed de lotes arrematados concluído!');
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
