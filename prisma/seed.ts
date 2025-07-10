// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import {
  sampleLotCategories, sampleStates, sampleCities, sampleAuctioneers, sampleSellers,
  sampleAuctions, sampleLots, sampleBids, sampleUserWins, sampleUserDocuments,
  sampleDocumentTypes, sampleNotifications, sampleMediaItems, sampleCourts,
  sampleJudicialDistricts, sampleJudicialBranches, sampleJudicialProcesses, sampleBens
} from './seed-data'; // Import from the new local data file
import { slugify } from '../src/lib/sample-data-helpers';
import bcrypt from 'bcrypt';
import { predefinedPermissions } from '@/app/admin/roles/role-form-schema'; // Import permissions

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);
  
  // --- Upsert Permissions ---
  console.log('Seeding permissions...');
  if(predefinedPermissions && predefinedPermissions.length > 0) {
    for (const perm of predefinedPermissions) {
        await prisma.permissao.upsert({
        where: { name: perm.id },
        update: { description: perm.label },
        create: { id: perm.id, name: perm.id, description: perm.label },
        });
    }
  } else {
    console.log('No predefined permissions found to seed.');
  }
  
  // --- Upsert Core Roles ---
  console.log('Seeding core roles...');
  
  const userPerms = await prisma.permissao.findMany({
    where: { name: { in: ['view_auctions', 'place_bids', 'view_lots'] } },
  });
  const adminPerms = await prisma.permissao.findMany({
    where: { name: 'manage_all' },
  });

  const userRole = await prisma.perfil.upsert({
    where: { name_normalized: 'USER' },
    update: {},
    create: {
      name: 'User',
      name_normalized: 'USER',
      description: 'Usuário padrão com permissões de visualização e lance.',
      permissions: {
        connect: userPerms.map(p => ({ id: p.id })),
      },
    },
  });

  const adminRole = await prisma.perfil.upsert({
    where: { name_normalized: 'ADMINISTRATOR' },
    update: {},
    create: {
      name: 'Administrator',
      name_normalized: 'ADMINISTRATOR',
      description: 'Acesso total à plataforma.',
      permissions: {
        connect: adminPerms.map(p => ({ id: p.id })),
      },
    },
  });
  
  // --- Upsert Admin User ---
  console.log('Seeding admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.usuario.upsert({
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
  await prisma.estado.createMany({ data: sampleStates, skipDuplicates: true });
  
  console.log('Seeding cities...');
  await prisma.cidade.createMany({ data: sampleCities, skipDuplicates: true });

  console.log('Seeding categories and subcategories...');
  for (const categoryData of sampleLotCategories) {
    const { subcategories, ...cat } = categoryData;
    const catToCreate = {
      ...cat,
      slug: slugify(cat.name),
      hasSubcategories: !!subcategories && subcategories.length > 0,
    };
    const createdCategory = await prisma.categoriaLote.upsert({
      where: { id: cat.id },
      update: catToCreate,
      create: catToCreate,
    });
    
    if (subcategories) {
      for (const subCatData of subcategories) {
         await prisma.subcategoria.upsert({
            where: { id: subCatData.id },
            update: {...subCatData, parentCategoryId: createdCategory.id, slug: slugify(subCatData.name)},
            create: {...subCatData, parentCategoryId: createdCategory.id, slug: slugify(subCatData.name)},
         });
      }
    }
  }

  console.log('Seeding document types...');
  await prisma.tipoDocumento.createMany({ data: sampleDocumentTypes.map(dt => ({...dt, aplicaA: dt.appliesTo, formatos: dt.allowedFormats })), skipDuplicates: true });

  console.log('Seeding courts...');
  await prisma.tribunal.createMany({ data: sampleCourts, skipDuplicates: true });
  
  console.log('Seeding judicial districts...');
  await prisma.comarca.createMany({ data: sampleJudicialDistricts, skipDuplicates: true });

  console.log('Seeding judicial branches...');
  await prisma.vara.createMany({ data: sampleJudicialBranches, skipDuplicates: true });

  console.log('Seeding sellers...');
  await prisma.vendedor.createMany({ data: sampleSellers as any, skipDuplicates: true });
  
  console.log('Seeding auctioneers...');
  await prisma.leiloeiro.createMany({ data: sampleAuctioneers as any, skipDuplicates: true });

  console.log('Seeding judicial processes...');
  for (const proc of sampleJudicialProcesses) {
    const { parties, ...procData } = proc;
    const createdProcess = await prisma.processoJudicial.upsert({
      where: { id: procData.id },
      update: procData as any,
      create: procData as any,
    });
    if (parties) {
      for (const party of parties) {
        await prisma.parteProcesso.upsert({
          where: { processoJudicialId_name_partyType: { processoJudicialId: createdProcess.id, name: party.name, partyType: party.partyType } },
          update: { documentNumber: party.documentNumber },
          create: {
            processoJudicialId: createdProcess.id,
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

  console.log('Seeding auctions...');
  await prisma.leilao.createMany({ data: sampleAuctions.map(({ lots, totalLots, auctioneer, seller, category, ...a }) => ({ ...a, etapas: a.auctionStages ? JSON.stringify(a.auctionStages) : null, gatilhosMentais: a.additionalTriggers ? a.additionalTriggers.join(',') : null })) as any, skipDuplicates: true });
  
  console.log('Seeding lots...');
  await prisma.lote.createMany({ data: sampleLots.map(({ auctionName, type, cityName, stateUf, subcategoryName, seller, sellerName, auctioneerName, isFavorite, ...l}) => l as any), skipDuplicates: true });

  console.log('Seeding bids...');
  await prisma.lance.createMany({ data: sampleBids as any, skipDuplicates: true });
  
  console.log('Seeding wins...');
  await prisma.arremate.createMany({ data: sampleUserWins.map(({lot, ...w}) => w) as any, skipDuplicates: true });
  
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
