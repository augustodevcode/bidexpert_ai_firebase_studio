// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import {
  sampleLotCategories, sampleStates, sampleCities, sampleAuctioneers, sampleSellers,
  sampleAuctions, sampleLots, sampleBids, sampleUserWins,
  sampleDocumentTypes, sampleNotifications, sampleMediaItems, sampleCourts,
  sampleJudicialDistricts, sampleJudicialBranches, sampleJudicialProcesses, sampleBens
} from './seed-data'; // Import from the new local data file
import { slugify } from '../src/lib/sample-data-helpers';
import bcrypt from 'bcrypt';
import { predefinedPermissions } from '@/app/admin/roles/role-form-schema';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);
  
  // --- Upsert Core Roles ---
  console.log('Seeding core roles...');
  const adminRole = await prisma.role.upsert({
    where: { name_normalized: 'ADMINISTRATOR' },
    update: {},
    create: {
      name: 'Administrator',
      name_normalized: 'ADMINISTRATOR',
      description: 'Acesso total à plataforma.',
      permissions: ['manage_all'],
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name_normalized: 'USER' },
    update: {},
    create: {
      name: 'User',
      name_normalized: 'USER',
      description: 'Usuário padrão com permissões de visualização e lance.',
      permissions: ['view_auctions', 'place_bids', 'view_lots'],
    },
  });
  
  // --- Upsert Admin User ---
  console.log('Seeding admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@bidexpert.com.br' },
    update: {
      password: hashedPassword,
      roleId: adminRole.id,
      habilitationStatus: 'HABILITADO',
    },
    create: {
      id: 'admin-bidexpert-platform-001',
      email: 'admin@bidexpert.com.br',
      fullName: 'Administrador',
      password: hashedPassword,
      habilitationStatus: 'HABILITADO',
      roleId: adminRole.id,
    },
  });
  
  // --- Seed other data ---
  console.log('Seeding states...');
  await prisma.state.createMany({ data: sampleStates, skipDuplicates: true });
  
  console.log('Seeding cities...');
  await prisma.city.createMany({ data: sampleCities, skipDuplicates: true });

  console.log('Seeding categories and subcategories...');
  for (const categoryData of sampleLotCategories) {
    const { subcategories, ...cat } = categoryData;
    const catToCreate = {
      ...cat,
      slug: slugify(cat.name),
      hasSubcategories: !!subcategories && subcategories.length > 0,
    };
    const createdCategory = await prisma.lotCategory.upsert({
      where: { id: cat.id },
      update: catToCreate,
      create: catToCreate,
    });
    
    if (subcategories) {
      for (const subCatData of subcategories) {
         await prisma.subcategory.upsert({
            where: { id: subCatData.id },
            update: {...subCatData, parentCategoryId: createdCategory.id, slug: slugify(subCatData.name)},
            create: {...subCatData, parentCategoryId: createdCategory.id, slug: slugify(subCatData.name)},
         });
      }
    }
  }

  console.log('Seeding document types...');
  await prisma.documentType.createMany({ data: sampleDocumentTypes.map(dt => ({...dt, appliesTo: dt.appliesTo as any})), skipDuplicates: true });

  console.log('Seeding courts...');
  await prisma.court.createMany({ data: sampleCourts, skipDuplicates: true });
  
  console.log('Seeding judicial districts...');
  await prisma.judicialDistrict.createMany({ data: sampleJudicialDistricts, skipDuplicates: true });

  console.log('Seeding judicial branches...');
  await prisma.judicialBranch.createMany({ data: sampleJudicialBranches, skipDuplicates: true });

  console.log('Seeding sellers...');
  await prisma.seller.createMany({ data: sampleSellers as any, skipDuplicates: true });
  
  console.log('Seeding auctioneers...');
  await prisma.auctioneer.createMany({ data: sampleAuctioneers as any, skipDuplicates: true });

  console.log('Seeding judicial processes...');
  for (const proc of sampleJudicialProcesses) {
    const { parties, ...procData } = proc;
    const createdProcess = await prisma.judicialProcess.upsert({
      where: { id: procData.id },
      update: procData as any,
      create: procData as any,
    });
    if (parties) {
      for (const party of parties) {
        await prisma.processParty.upsert({
          where: { processId_name_partyType: { processId: createdProcess.id, name: party.name, partyType: party.partyType } },
          update: { documentNumber: party.documentNumber },
          create: {
            processId: createdProcess.id,
            name: party.name,
            partyType: party.partyType,
            documentNumber: party.documentNumber,
          }
        });
      }
    }
  }
  
  console.log('Seeding bens...');
  await prisma.bem.createMany({ data: sampleBens.map(({categoryName, subcategoryName, judicialProcessNumber, sellerName, ...b}) => b) as any, skipDuplicates: true });

  // Use createMany and handle JSON fields properly
  console.log('Seeding auctions...');
  const auctionsToCreate = sampleAuctions.map(({ lots, totalLots, auctioneer, seller, category, auctionStages, ...a }) => ({
    ...a,
    auctionStages: auctionStages ? JSON.parse(auctionStages) : [],
  }));
  await prisma.auction.createMany({ data: auctionsToCreate as any, skipDuplicates: true });
  
  console.log('Seeding lots...');
  await prisma.lot.createMany({ data: sampleLots.map(({ auctionName, type, cityName, stateUf, subcategoryName, seller, sellerName, auctioneerName, isFavorite, ...l}) => l as any), skipDuplicates: true });

  console.log('Seeding bids...');
  await prisma.bid.createMany({ data: sampleBids as any, skipDuplicates: true });
  
  console.log('Seeding wins...');
  await prisma.userWin.createMany({ data: sampleUserWins.map(({lot, ...w}) => w) as any, skipDuplicates: true });
  
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
