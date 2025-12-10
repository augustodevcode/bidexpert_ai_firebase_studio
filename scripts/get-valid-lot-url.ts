
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lot = await prisma.lot.findFirst({
    where: {
      auction: {
        status: {
          in: ['ABERTO', 'ABERTO_PARA_LANCES']
        }
      }
    },
    include: {
      auction: true
    }
  });

  if (lot && lot.auction) {
    const auctionId = lot.auction.publicId || lot.auction.id;
    const lotId = lot.publicId || lot.id;
    console.log(`FOUND_URL: /auctions/${auctionId}/lots/${lotId}`);
  } else {
    console.log('NO_LOT_FOUND');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
