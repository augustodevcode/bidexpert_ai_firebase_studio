import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDirectSaleData() {
  console.log('Checking direct sale offer data...');
  
  // Get a few direct sale offers to check their fields
  const offers = await prisma.directSaleOffer.findMany({
    take: 3,
    orderBy: {
      id: 'desc'
    }
  });
  
  console.log(`Found ${offers.length} direct sale offers:`);
  offers.forEach((offer, index) => {
    console.log(`\nOffer ${index + 1}:`);
    console.log(`  Title: ${offer.title}`);
    console.log(`  Image URL: ${offer.imageUrl}`);
    console.log(`  AI Hint: ${offer.dataAiHint}`);
  });
  
  await prisma.$disconnect();
}

checkDirectSaleData();