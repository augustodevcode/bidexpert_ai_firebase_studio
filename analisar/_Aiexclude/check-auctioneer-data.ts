import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAuctioneerData() {
  console.log('Checking auctioneer data...');
  
  // Get a few auctioneers to check their fields
  const auctioneers = await prisma.auctioneer.findMany({
    take: 3,
    orderBy: {
      id: 'desc'
    }
  });
  
  console.log(`Found ${auctioneers.length} auctioneers:`);
  auctioneers.forEach((auctioneer, index) => {
    console.log(`\nAuctioneer ${index + 1}:`);
    console.log(`  Name: ${auctioneer.name}`);
    console.log(`  Registration Number: ${auctioneer.registrationNumber}`);
    console.log(`  Email: ${auctioneer.email}`);
    console.log(`  Phone: ${auctioneer.phone}`);
    console.log(`  Website: ${auctioneer.website}`);
    console.log(`  Contact Name: ${auctioneer.contactName}`);
    console.log(`  Address: ${auctioneer.address}`);
    console.log(`  City: ${auctioneer.city}`);
    console.log(`  State: ${auctioneer.state}`);
    console.log(`  Zip Code: ${auctioneer.zipCode}`);
    console.log(`  Logo URL: ${auctioneer.logoUrl}`);
  });
  
  await prisma.$disconnect();
}

checkAuctioneerData();