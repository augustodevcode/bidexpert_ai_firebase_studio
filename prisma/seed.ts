
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
  console.log('--- [DB SEED] Iniciando processo de semeadura do banco de dados completo ---');

  // Check if seeding has already been done by looking for the admin user
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@bidexpert.com.br' },
  });

  if (adminUser) {
    console.log('[DB SEED] INFO: O banco de dados já foi semeado (usuário admin existe). Pulando a semeadura.');
    return;
  }
  
  console.log('[DB SEED] INFO: O banco de dados parece estar vazio. Continuando com a semeadura completa.');

  // 1. Seed essential data without dependencies
  console.log('[DB SEED] Semeando Roles...');
  for (const role of sampleRoles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: { ...role, permissions: { set: role.permissions } },
    });
  }
  
  console.log('[DB SEED] Semeando Platform Settings...');
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

  console.log('[DB SEED] Semeando States and Cities...');
  for (const state of sampleStates) {
    await prisma.state.upsert({ where: { id: state.id }, update: {}, create: state });
  }
  for (const city of sampleCities) {
    await prisma.city.upsert({ where: { id: city.id }, update: {}, create: city });
  }

  console.log('[DB SEED] Semeando Categories and Subcategories...');
  for (const category of sampleLotCategories) {
    await prisma.lotCategory.upsert({ where: { id: category.id }, update: {}, create: { ...category, hasSubcategories: sampleSubcategories.some(s => s.parentCategoryId === category.id) } });
  }
  for (const subcategory of sampleSubcategories) {
    await prisma.subcategory.upsert({ where: { id: subcategory.id }, update: {}, create: subcategory });
  }

  // 2. Seed Users
  console.log('[DB SEED] Semeando Users...');
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
  console.log('[DB SEED] Semeando Sellers and Auctioneers...');
  for (const seller of sampleSellers) {
    await prisma.seller.upsert({ where: { id: seller.id }, update: {}, create: seller });
  }
  for (const auctioneer of sampleAuctioneers) {
    await prisma.auctioneer.upsert({ where: { id: auctioneer.id }, update: {}, create: auctioneer });
  }

  // 4. Seed Judicial Entities
  console.log('[DB SEED] Semeando Judicial Entities...');
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
  console.log('[DB SEED] Semeando Bens (Assets)...');
  for (const bem of sampleBens) {
    const bemDataForPrisma = {
        ...bem,
        amenities: undefined, // Remove the raw amenities array if it exists
    };

    if (bem.amenities && Array.isArray(bem.amenities) && bem.amenities.every(a => typeof a === 'object' && 'value' in a)) {
        // Correct format, can be used in create
        bemDataForPrisma.amenities = { create: bem.amenities };
    }
    await prisma.bem.upsert({ where: { id: bem.id }, update: {}, create: bemDataForPrisma as any });
  }

  // 6. Seed Auctions, Lots, and Bids
  console.log('[DB SEED] Semeando Auctions, Lots, and Bids...');
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
  console.log('[DB SEED] Semeando dados restantes...');
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

  console.log('✅ [DB SEED] Processo de semeadura finalizado com sucesso.');
}

main()
  .catch((e) => {
    console.error('❌ [DB SEED] Erro durante o processo de semeadura:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

    