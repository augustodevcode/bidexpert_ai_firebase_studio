
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting seed-stages script...');

    // 1. Find up to 5 recent auctions
    const auctions = await prisma.auction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { stages: true }
    });

    console.log(`Found ${auctions.length} auctions.`);

    for (const auction of auctions) {
      console.log(`Processing Auction: ${auction.title} (ID: ${auction.id})`);

      if (auction.stages.length > 0) {
        console.log('  - Already has stages. Skipping.');
        continue;
      }

      // 2. Create Stages
      const now = new Date();
      const stage1Start = new Date(now);
      stage1Start.setDate(now.getDate() + 1);
      const stage1End = new Date(now);
      stage1End.setDate(now.getDate() + 4);

      const stage2Start = new Date(now);
      stage2Start.setDate(now.getDate() + 5);
      const stage2End = new Date(now);
      stage2End.setDate(now.getDate() + 8);

      const initialPrice = Number(auction.initialOffer) || 10000;

      console.log('  - Creating 2 stages...');

      await prisma.auctionStage.createMany({
        data: [
          {
            auctionId: auction.id,
            name: '1ª Praça',
            startDate: stage1Start,
            endDate: stage1End,
            initialPrice: initialPrice,
            status: 'AGUARDANDO_INICIO'
          },
          {
            auctionId: auction.id,
            name: '2ª Praça',
            startDate: stage2Start,
            endDate: stage2End,
            initialPrice: initialPrice * 0.5, // 50% discount
            status: 'AGUARDANDO_INICIO'
          }
        ]
      });

      console.log('  - Stages created successfully.');
    }

    console.log('Seed stages completed.');

  } catch (error) {
    console.error('Error seeding stages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
