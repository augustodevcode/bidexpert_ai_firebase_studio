
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAuctions() {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: 800001 }
    });
    
    if (auction) {
      console.log('Auction 800001 found:', JSON.stringify(auction, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      , 2));
    } else {
      console.log('Auction 1 NOT FOUND');
      const first = await prisma.auction.findFirst();
      if (first) {
        console.log('First available auction:', JSON.stringify(first, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        , 2));
      } else {
        console.log('No auctions found in database.');
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuctions();
