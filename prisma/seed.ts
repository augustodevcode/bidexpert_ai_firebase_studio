// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  sampleRoles, sampleAuctioneers, sampleSellers, sampleStates, sampleCities,
  sampleCourts, sampleJudicialDistricts, sampleJudicialBranches,
  sampleJudicialProcesses, sampleLotCategories, sampleSubcategories, sampleBens,
  sampleAuctions, sampleLots, sampleDirectSaleOffers, sampleDocumentTypes,
  samplePlatformSettings, sampleUsers, sampleUserWins, sampleBids, sampleNotifications
} from '../src/lib/sample-data';
import { slugify } from '../src/lib/sample-data-helpers';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding process started...');

  // Check if seeding has already been done by looking for the admin user
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@bidexpert.com.br' },
  });

  if (adminUser) {
    console.log('Database already seeded. Admin user exists. Skipping seeding.');
    return;
  }
  
  console.log('Database appears to be empty. Proceeding with seeding.');

  // 1. Seed essential data without dependencies
  console.log('Seeding Roles...');
  for (const role of sampleRoles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: { ...role, permissions: { set: role.permissions } },
    });
  }
  
  console.log('Seeding Platform Settings...');
  await prisma.platformSettings.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      ...samplePlatformSettings,
      themes: { create: samplePlatformSettings.themes },
      platformPublicIdMasks: samplePlatformSettings.platformPublicIdMasks ? { create: samplePlatformSettings.platformPublicIdMasks } : undefined,
      mapSettings: samplePlatformSettings.mapSettings ? { create: samplePlatformSettings.mapSettings } : undefined,
      biddingSettings: samplePlatformSettings.biddingSettings ? { create: samplePlatformSettings.biddingSettings } : undefined,
      mentalTriggerSettings: samplePlatformSettings.mentalTriggerSettings ? { create: samplePlatformSettings.mentalTriggerSettings } : undefined,
      sectionBadgeVisibility: samplePlatformSettings.sectionBadgeVisibility ? { create: samplePlatformSettings.sectionBadgeVisibility } : undefined,
      variableIncrementTable: samplePlatformSettings.variableIncrementTable ? { create: samplePlatformSettings.variableIncrementTable } : undefined,
    },
  });

  console.log('Seeding States and Cities...');
  for (const state of sampleStates) {
    await prisma.state.upsert({ where: { id: state.id }, update: {}, create: state });
  }
  for (const city of sampleCities) {
    await prisma.city.upsert({ where: { id: city.id }, update: {}, create: city });
  }

  console.log('Seeding Categories and Subcategories...');
  for (const category of sampleLotCategories) {
    await prisma.lotCategory.upsert({ where: { id: category.id }, update: {}, create: { ...category, hasSubcategories: sampleSubcategories.some(s => s.parentCategoryId === category.id) } });
  }
  for (const subcategory of sampleSubcategories) {
    await prisma.subcategory.upsert({ where: { id: subcategory.id }, update: {}, create: subcategory });
  }

  // 2. Seed Users
  console.log('Seeding Users...');
  const saltRounds = 10;
  for (const user of sampleUsers) {
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        ...user,
        password: hashedPassword,
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
      },
    });
  }

  // 3. Seed Sellers and Auctioneers
  console.log('Seeding Sellers and Auctioneers...');
  for (const seller of sampleSellers) {
    await prisma.seller.upsert({ where: { id: seller.id }, update: {}, create: seller });
  }
  for (const auctioneer of sampleAuctioneers) {
    await prisma.auctioneer.upsert({ where: { id: auctioneer.id }, update: {}, create: auctioneer });
  }

  // 4. Seed Judicial Entities
  console.log('Seeding Judicial Entities...');
  for (const court of sampleCourts) {
    await prisma.court.upsert({ where: { id: court.id }, update: {}, create: court });
  }
  for (const district of sampleJudicialDistricts) {
    await prisma.judicialDistrict.upsert({ where: { id: district.id }, update: {}, create: district });
  }
  for (const branch of sampleJudicialBranches) {
    await prisma.judicialBranch.upsert({ where: { id: branch.id }, update: {}, create: branch });
  }
  for (const process of sampleJudicialProcesses) {
    await prisma.judicialProcess.upsert({
      where: { id: process.id },
      update: {},
      create: { ...process, parties: { create: process.parties } },
    });
  }

  // 5. Seed Bens (Assets)
  console.log('Seeding Bens...');
  for (const bem of sampleBens) {
    await prisma.bem.upsert({ where: { id: bem.id }, update: {}, create: {
      ...bem,
      amenities: bem.amenities ? { create: bem.amenities } : undefined,
    } });
  }

  // 6. Seed Auctions, Lots, and Bids
  console.log('Seeding Auctions, Lots, and Bids...');
  for (const auction of sampleAuctions) {
    await prisma.auction.upsert({
      where: { id: auction.id },
      update: {},
      create: {
        ...auction,
        lots: undefined,
        totalLots: sampleLots.filter(l => l.auctionId === auction.id).length,
        auctionStages: auction.auctionStages ? { create: auction.auctionStages } : undefined,
      },
    });
  }

  for (const lot of sampleLots) {
    await prisma.lot.upsert({
      where: { id: lot.id },
      update: {},
      create: {
        ...lot,
        bens: { connect: lot.bemIds?.map(id => ({ id })) },
      },
    });
  }
  for (const bid of sampleBids) {
    await prisma.bid.upsert({ where: { id: bid.id }, update: {}, create: bid });
  }

  // 7. Seed remaining data
  console.log('Seeding remaining data...');
  for (const win of sampleUserWins) {
    await prisma.userWin.upsert({ where: { id: win.id }, update: {}, create: win });
  }
  for (const offer of sampleDirectSaleOffers) {
    await prisma.directSaleOffer.upsert({ where: { id: offer.id }, update: {}, create: offer });
  }
  for (const template of sampleDocumentTypes) {
    await prisma.documentType.upsert({ where: { id: template.id }, update: {}, create: template });
  }
   for (const notification of sampleNotifications) {
    await prisma.notification.upsert({ where: { id: notification.id }, update: {}, create: notification });
  }


  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
