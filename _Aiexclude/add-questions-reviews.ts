import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Adding Questions & Reviews...\n');

  const users = await prisma.user.findMany({ take: 10 });

  // 1. Add questions to lots
  console.log('Adding questions...');
  // Buscar lotes que têm auctionId definido
  const lotsNoQuestions = await prisma.lot.findMany({
    where: {
      auctionId: {
        not: undefined, // Usando undefined em vez de null para evitar problemas de tipagem
      },
    },
    take: 50,
  });

  let qCount = 0;
  for (const lot of lotsNoQuestions) {
    for (let i = 0; i < 2; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      try {
        await prisma.lotQuestion.create({
          data: {
            lotId: lot.id,
            auctionId: lot.auctionId!,
            userId: user.id,
            userDisplayName: user.fullName || 'User',
            questionText: faker.helpers.arrayElement([
              'Qual o estado?',
              'Aceita visita?',
              'Tem nota fiscal?',
            ]),
            answerText: 'Sim',
          },
        });
        qCount++;
      } catch (e) {}
    }
  }
  console.log(`✅ ${qCount} questions added\n`);

  // 2. Add reviews to sold lots
  console.log('Adding reviews...');
  const soldLotsNoReviews = await prisma.lot.findMany({
    where: {
      status: 'VENDIDO',
      auctionId: { not: null },
    },
    take: 20,
  });

  let rCount = 0;
  for (const lot of soldLotsNoReviews) {
    const user = users[Math.floor(Math.random() * users.length)];
    try {
      await prisma.review.create({
        data: {
          lotId: lot.id,
          auctionId: lot.auctionId!,
          userId: user.id,
          userDisplayName: user.fullName || 'User',
          rating: 5,
          comment: 'Ótimo!',
        },
      });
      rCount++;
    } catch (e) {}
  }
  console.log(`✅ ${rCount} reviews added\n`);

  console.log('✅ DONE!\n');
  await prisma.$disconnect();
}

main();
