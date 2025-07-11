import { PrismaClient } from '@prisma/client';
import { sampleData } from '../src/lib/sample-data';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MySQL database...');

  try {
    // Clear existing data (optional, depending on desired behavior)
    // await prisma.yourModelName.deleteMany({});

    // Seed categories
    for (const categoryData of sampleData.categories) {
      await prisma.category.create({ data: categoryData });
    }
    console.log('Categories seeded.');

    // Seed subcategories
    for (const subcategoryData of sampleData.subcategories) {
      await prisma.subcategory.create({ data: subcategoryData });
    }
    console.log('Subcategories seeded.');

    // Seed states
    for (const stateData of sampleData.states) {
      await prisma.state.create({ data: stateData });
    }
    console.log('States seeded.');

    // Seed cities
    for (const cityData of sampleData.cities) {
      await prisma.city.create({ data: cityData });
    }
    console.log('Cities seeded.');

    // Seed auctioneers
    for (const auctioneerData of sampleData.auctioneers) {
      await prisma.auctioneer.create({ data: auctioneerData });
    }
    console.log('Auctioneers seeded.');

    // Seed sellers
    for (const sellerData of sampleData.sellers) {
      await prisma.seller.create({ data: sellerData });
    }
    console.log('Sellers seeded.');

    // Seed auctions
    for (const auctionData of sampleData.auctions) {
      await prisma.auction.create({ data: auctionData });
    }
    console.log('Auctions seeded.');

    // Seed lots
    for (const lotData of sampleData.lots) {
      await prisma.lot.create({ data: lotData });
    }
    console.log('Lots seeded.');

    // Seed direct sales offers
    for (const offerData of sampleData.directSalesOffers) {
      await prisma.directSalesOffer.create({ data: offerData });
    }
    console.log('Direct Sales Offers seeded.');

    console.log('MySQL database seeding complete.');
  } catch (error) {
    console.error('Error seeding MySQL database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();