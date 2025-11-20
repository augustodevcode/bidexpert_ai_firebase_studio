
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const auctions = await prisma.auction.findMany({
    where: {
      title: { contains: 'Leilão' }
    },
    take: 5
  });
  console.log('Auctions with "Leilão":', auctions.length);
  if (auctions.length > 0) {
    console.log('First match:', auctions[0].title);
  } else {
    const all = await prisma.auction.findMany({ take: 1 });
    console.log('Any auction:', all[0]?.title);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
