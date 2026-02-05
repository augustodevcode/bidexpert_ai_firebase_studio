import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting coordinates fix...');

  // Fix Auctions
  const auctions = await prisma.auction.findMany({
    where: {
      OR: [
        { latitude: null },
        { longitude: null }
      ]
    },
    select: { id: true }
  });

  console.log(`Found ${auctions.length} auctions with missing coordinates.`);

  for (const auction of auctions) {
    // Latitude: between -10 and -30
    // Longitude: between -40 and -55
    const latitude = -10 - (Math.random() * 20); 
    const longitude = -40 - (Math.random() * 15); 

    await prisma.auction.update({
      where: { id: auction.id },
      data: {
        latitude: latitude,
        longitude: longitude
      }
    });

    console.log(`Updated Auction ID: ${auction.id} with Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`);
  }

  // Fix Lots
  const lots = await prisma.lot.findMany({
    where: {
      OR: [
        { latitude: null },
        { longitude: null }
      ]
    },
    select: { id: true }
  });

  console.log(`Found ${lots.length} lots with missing coordinates.`);

  for (const lot of lots) {
    const latitude = -10 - (Math.random() * 20); 
    const longitude = -40 - (Math.random() * 15); 

    await prisma.lot.update({
      where: { id: lot.id },
      data: {
        latitude: latitude,
        longitude: longitude
      }
    });

     console.log(`Updated Lot ID: ${lot.id} with Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`);
  }

  console.log('Finished updating coordinates.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
