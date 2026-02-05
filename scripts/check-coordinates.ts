
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking Auction coordinates...');
  const totalAuctions = await prisma.auction.count();
  const auctionsWithCoords = await prisma.auction.count({
    where: {
      AND: [
        { latitude: { not: null } },
        { longitude: { not: null } }
      ]
    }
  });

  console.log(`Total Auctions: ${totalAuctions}`);
  console.log(`Auctions with Coordinates: ${auctionsWithCoords}`);

  if (auctionsWithCoords > 0) {
    const sampleAuctions = await prisma.auction.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      },
      take: 3,
      select: { id: true, title: true, latitude: true, longitude: true }
    });
    console.log('Sample Auctions with Coords:', sampleAuctions);
  } else {
    console.log('No auctions with coordinates found.');
  }

  console.log('\nChecking Lot coordinates...');
  const totalLots = await prisma.lot.count();
  const lotsWithCoords = await prisma.lot.count({
    where: {
      AND: [
        { latitude: { not: null } },
        { longitude: { not: null } }
      ]
    }
  });

  console.log(`Total Lots: ${totalLots}`);
  console.log(`Lots with Coordinates: ${lotsWithCoords}`);

  if (lotsWithCoords > 0) {
    const sampleLots = await prisma.lot.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      },
      take: 3,
      select: { id: true, title: true, latitude: true, longitude: true }
    });
    console.log('Sample Lots with Coords:', sampleLots);
  } else {
     console.log('No lots with coordinates found.');
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
