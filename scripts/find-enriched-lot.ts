import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findEnrichedLot() {
  const lot = await prisma.lot.findFirst({
    where: { publicId: 'LOTE-PUB-624f814e' },
    include: {
      auction: true,
      assets: { include: { asset: true } },
      questions: true,
      reviews: true,
    },
  });

  if (lot) {
    console.log('✅ Found enriched lot:');
    console.log(`  Auction ID: ${lot.auctionId.toString()}`);
    console.log(`  Auction Public ID: ${lot.auction?.publicId}`);
    console.log(`  Lot Public ID: ${lot.publicId}`);
    console.log(`  Map Address: ${lot.mapAddress}`);
    console.log(`  City: ${lot.cityName}, ${lot.stateUf}`);
    console.log(`  Gallery Images: ${lot.galleryImageUrls ? JSON.parse(lot.galleryImageUrls as string).length : 0}`);
    console.log(`  Questions: ${lot.questions.length}`);
    console.log(`  Reviews: ${lot.reviews.length}`);
    console.log(`\n  URL: /auctions/${lot.auctionId}/lots/${lot.publicId}`);
  } else {
    console.log('❌ Lot not found');
  }

  await prisma.$disconnect();
}

findEnrichedLot();
