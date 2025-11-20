
import { prisma } from '../src/lib/prisma';

async function main() {
  const lot = await prisma.lot.findFirst({
    where: {
      auctionId: 154,
      number: '001'
    }
  });

  if (lot) {
    console.log(`Lot Found: ID=${lot.id}, Slug=${lot.slug}, PublicId=${lot.publicId}`);
  } else {
    console.log('Lot NOT Found');
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
