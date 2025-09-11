import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding essential data...');

  // Seed Roles
  await prisma.role.upsert({
    where: { nameNormalized: 'ADMINISTRADOR' },
    update: {},
    create: {
      name: 'Administrador',
      nameNormalized: 'ADMINISTRADOR',
      description: 'Acesso total ao sistema',
      permissions: { all: true },
    },
  });
  await prisma.role.upsert({
    where: { nameNormalized: 'ARREMATANTE' },
    update: {},
    create: {
      name: 'Arrematante',
      nameNormalized: 'ARREMATANTE',
      description: 'Participa dos leilões',
      permissions: { bid: true },
    },
  });

  // Seed States
  await prisma.state.upsert({
    where: { uf: 'SP' },
    update: {},
    create: {
      name: 'São Paulo',
      uf: 'SP',
      slug: 'sao-paulo',
    },
  });

  // Seed Cities
  await prisma.city.upsert({
    where: { ibgeCode: '3550308' },
    update: {},
    create: {
      name: 'São Paulo',
      slug: 'sao-paulo',
      stateId: (await prisma.state.findUnique({ where: { uf: 'SP' } }))!.id,
      ibgeCode: '3550308',
    },
  });

  // Seed Categories
  await prisma.lotCategory.upsert({
    where: { slug: 'veiculos' },
    update: {},
    create: {
      name: 'Veículos',
      slug: 'veiculos',
      description: 'Carros, motos e outros veículos',
    },
  });

  // Seed Subcategories
  await prisma.subcategory.upsert({
    where: { slug: 'carros' },
    update: {},
    create: {
      name: 'Carros',
      slug: 'carros',
      parentCategoryId: (await prisma.lotCategory.findUnique({ where: { slug: 'veiculos' } }))!.id,
    },
  });

  // Seed Document Types
  await prisma.documentType.upsert({
    where: { name: 'RG' },
    update: {},
    create: {
      name: 'RG',
      description: 'Registro Geral',
    },
  });

  // Seed Platform Settings
  await prisma.platformSettings.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      siteTitle: 'BidExpert',
      siteTagline: 'Sua plataforma de leilões online',
      searchItemsPerPage: 12,
    },
  });

  console.log('Finished seeding essential data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
