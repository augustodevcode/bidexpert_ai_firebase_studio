// scripts/seed-data-extended.ts
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function createTenant() {
  const tenant = await prisma.tenant.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      name: 'Landlord Tenant',
      subdomain: 'landlord',
    },
  });
  console.log(`Created/found tenant: ${tenant.name}`);
  return tenant;
}

async function createRoles(tenantId: string) {
  const roles = ['ADMIN', 'User', 'AUCTIONEER', 'SELLER'];
  const createdRoles = [];
  for (const roleName of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        nameNormalized: roleName.toUpperCase(),
        description: `Role for ${roleName}`,
      },
    });
    createdRoles.push(role);
    console.log(`Created/found role: ${role.name}`);
  }
  return createdRoles;
}

async function createUsers(tenantId: string, roles: any[]) {
  const users = [];
  const adminRole = roles.find(r => r.nameNormalized === 'ADMIN');
  const userRole = roles.find(r => r.nameNormalized === 'USER');

  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      fullName: 'Admin User',
      password: 'password',
    },
  });
  await prisma.usersOnRoles.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
      assignedBy: 'seed-script',
    },
  });
  await prisma.usersOnTenants.upsert({
    where: { userId_tenantId: { userId: adminUser.id, tenantId: tenantId } },
    update: {},
    create: {
      userId: adminUser.id,
      tenantId: tenantId,
    },
  });
  users.push(adminUser);
  console.log(`Created/found admin user: ${adminUser.email}`);

  // Regular user
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      fullName: 'Regular User',
      password: 'password',
    },
  });
  await prisma.usersOnRoles.upsert({
    where: { userId_roleId: { userId: regularUser.id, roleId: userRole.id } },
    update: {},
    create: {
      userId: regularUser.id,
      roleId: userRole.id,
      assignedBy: 'seed-script',
    },
  });
  await prisma.usersOnTenants.upsert({
    where: { userId_tenantId: { userId: regularUser.id, tenantId: tenantId } },
    update: {},
    create: {
      userId: regularUser.id,
      tenantId: tenantId,
    },
  });
  users.push(regularUser);
  console.log(`Created/found regular user: ${regularUser.email}`);

  return users;
}

async function createStatesAndCities(tenantId: string) {
  const statesData = [
    { uf: 'AC', name: 'Acre', capital: 'Rio Branco' },
    { uf: 'AL', name: 'Alagoas', capital: 'Maceió' },
    { uf: 'AP', name: 'Amapá', capital: 'Macapá' },
    { uf: 'AM', name: 'Amazonas', capital: 'Manaus' },
    { uf: 'BA', name: 'Bahia', capital: 'Salvador' },
    { uf: 'CE', name: 'Ceará', capital: 'Fortaleza' },
    { uf: 'DF', name: 'Distrito Federal', capital: 'Brasília' },
    { uf: 'ES', name: 'Espírito Santo', capital: 'Vitória' },
    { uf: 'GO', name: 'Goiás', capital: 'Goiânia' },
    { uf: 'MA', name: 'Maranhão', capital: 'São Luís' },
    { uf: 'MT', name: 'Mato Grosso', capital: 'Cuiabá' },
    { uf: 'MS', name: 'Mato Grosso do Sul', capital: 'Campo Grande' },
    { uf: 'MG', name: 'Minas Gerais', capital: 'Belo Horizonte' },
    { uf: 'PA', name: 'Pará', capital: 'Belém' },
    { uf: 'PB', name: 'Paraíba', capital: 'João Pessoa' },
    { uf: 'PR', name: 'Paraná', capital: 'Curitiba' },
    { uf: 'PE', name: 'Pernambuco', capital: 'Recife' },
    { uf: 'PI', name: 'Piauí', capital: 'Teresina' },
    { uf: 'RJ', name: 'Rio de Janeiro', capital: 'Rio de Janeiro' },
    { uf: 'RN', name: 'Rio Grande do Norte', capital: 'Natal' },
    { uf: 'RS', name: 'Rio Grande do Sul', capital: 'Porto Alegre' },
    { uf: 'RO', name: 'Rondônia', capital: 'Porto Velho' },
    { uf: 'RR', name: 'Roraima', capital: 'Boa Vista' },
    { uf: 'SC', name: 'Santa Catarina', capital: 'Florianópolis' },
    { uf: 'SP', name: 'São Paulo', capital: 'São Paulo' },
    { uf: 'SE', name: 'Sergipe', capital: 'Aracaju' },
    { uf: 'TO', name: 'Tocantins', capital: 'Palmas' },
  ];

  const states = [];
  const cities = [];
  const capitals = [];

  for (const stateData of statesData) {
    const state = await prisma.state.upsert({
      where: { uf: stateData.uf },
      update: {},
      create: { uf: stateData.uf, name: stateData.name },
    });
    states.push(state);

    // Create capital city
    const capitalCity = await prisma.city.upsert({
      where: { name_stateId: { name: stateData.capital, stateId: state.id } },
      update: {},
      create: { name: stateData.capital, stateId: state.id },
    });
    cities.push(capitalCity);
    capitals.push(capitalCity);

    // Create 5-10 other random cities for each state
    for (let i = 0; i < faker.number.int({ min: 5, max: 10 }); i++) {
      const cityName = faker.location.city();
      const otherCity = await prisma.city.upsert({
        where: { name_stateId: { name: cityName, stateId: state.id } },
        update: {},
        create: { name: cityName, stateId: state.id },
      });
      cities.push(otherCity);
    }
  }

  console.log('Created/found states and cities.');
  return { states, cities, capitals };
}

async function createAuctioneers(tenantId: string, cities: any[]) {
  const auctioneers = [];
  for (let i = 0; i < 2; i++) { // Create 2 auctioneers
    const city = faker.helpers.arrayElement(cities);
    const auctioneer = await prisma.auctioneer.upsert({
      where: { publicId: faker.string.uuid() }, // Using publicId as unique identifier
      update: {},
      create: {
        publicId: faker.string.uuid(),
        slug: faker.lorem.slug(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        city: city.name,
        tenantId: tenantId,
      },
    });
    auctioneers.push(auctioneer);
    console.log(`Created auctioneer: ${auctioneer.name}`);
  }
  return auctioneers;
}

async function createSellers(tenantId: string, cities: any[]) {
  const sellers = [];
  for (let i = 0; i < 20; i++) { // Create 20 sellers
    const city = faker.helpers.arrayElement(cities);
    const seller = await prisma.seller.upsert({
      where: { name: faker.company.name() }, // Using name as unique identifier
      update: {},
      create: {
        publicId: faker.string.uuid(),
        slug: faker.lorem.slug(),
        name: faker.company.name(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        city: city.name,
        tenantId: tenantId,
      },
    });
    sellers.push(seller);
    console.log(`Created seller: ${seller.name}`);
  }
  return sellers;
}

async function createCourts(tenantId: string, states: any[]) {
  const courts = [];
  for (let i = 0; i < 5; i++) {
    const state = faker.helpers.arrayElement(states);
    const court = await prisma.court.create({
      data: {
        name: `Vara ${faker.lorem.word()} ${state.uf}`,
        slug: faker.lorem.slug(),
        stateUf: state.uf,
        website: faker.internet.url(),
      },
    });
    courts.push(court);
    console.log(`Created court: ${court.name}`);
  }
  return courts;
}

async function createJudicialParties(processId: string) {
  const partyTypes = ['AUTOR', 'REU', 'ADVOGADO_AUTOR', 'ADVOGADO_REU', 'TERCEIRO_INTERESSADO'];
  const judicialParties = [];
  for (let i = 0; i < faker.number.int({ min: 2, max: 5 }); i++) {
    const partyType = faker.helpers.arrayElement(partyTypes);
    const judicialParty = await prisma.judicialParty.create({
      data: {
        processId: processId,
        name: faker.person.fullName(),
        documentNumber: faker.string.numeric(11),
        partyType: partyType as any,
      },
    });
    judicialParties.push(judicialParty);
    console.log(`  Created judicial party: ${judicialParty.name} (${judicialParty.partyType})`);
  }
  return judicialParties;
}

async function createCategoriesAndSubcategories(tenantId: string) {
  const categories = [];
  const subcategories = [];

  const vehicles = await prisma.lotCategory.upsert({
    where: { name_tenantId: { name: 'Veículos', tenantId: tenantId } },
    update: {},
    create: { name: 'Veículos', tenantId: tenantId },
  });
  categories.push(vehicles);
  subcategories.push(await prisma.subcategory.upsert({
    where: { name_lotCategoryId_tenantId: { name: 'Carros', lotCategoryId: vehicles.id, tenantId: tenantId } },
    update: {},
    create: { name: 'Carros', lotCategoryId: vehicles.id, tenantId: tenantId },
  }));
  subcategories.push(await prisma.subcategory.upsert({
    where: { name_lotCategoryId_tenantId: { name: 'Motos', lotCategoryId: vehicles.id, tenantId: tenantId } },
    update: {},
    create: { name: 'Motos', lotCategoryId: vehicles.id, tenantId: tenantId },
  }));

  const realEstate = await prisma.lotCategory.upsert({
    where: { name_tenantId: { name: 'Imóveis', tenantId: tenantId } },
    update: {},
    create: { name: 'Imóveis', tenantId: tenantId },
  });
  categories.push(realEstate);
  subcategories.push(await prisma.subcategory.upsert({
    where: { name_lotCategoryId_tenantId: { name: 'Apartamentos', lotCategoryId: realEstate.id, tenantId: tenantId } },
    update: {},
    create: { name: 'Apartamentos', lotCategoryId: realEstate.id, tenantId: tenantId },
  }));
  subcategories.push(await prisma.subcategory.upsert({
    where: { name_lotCategoryId_tenantId: { name: 'Casas', lotCategoryId: realEstate.id, tenantId: tenantId } },
    update: {},
    create: { name: 'Casas', lotCategoryId: realEstate.id, tenantId: tenantId },
  }));

  console.log('Created/found categories and subcategories.');
  return { categories, subcategories };
}

async function createJudicialProcesses(tenantId: string, cities: any[], courts: any[]) {
  const judicialProcesses = [];
  for (let i = 0; i < 10; i++) {
    const city = faker.helpers.arrayElement(cities);
    const court = faker.helpers.arrayElement(courts);
    const judicialProcess = await prisma.judicialProcess.upsert({
      where: { processNumber_tenantId: { processNumber: faker.string.numeric(7) + '-' + faker.string.numeric(2) + '.' + faker.string.numeric(4) + '.' + faker.string.numeric(1) + '.' + faker.string.numeric(2) + '.' + faker.string.numeric(4), tenantId: tenantId } },
      update: {},
      create: {
        processNumber: faker.string.numeric(7) + '-' + faker.string.numeric(2) + '.' + faker.string.numeric(4) + '.' + faker.string.numeric(1) + '.' + faker.string.numeric(2) + '.' + faker.string.numeric(4),
        courtId: court.id,
        judicialBranch: faker.commerce.department(),
        judicialDistrict: faker.location.city(),
        cityId: city.id,
        tenantId: tenantId,
      },
    });
    judicialProcesses.push(judicialProcess);
    await createJudicialParties(judicialProcess.id);
    console.log(`Created judicial process: ${judicialProcess.processNumber}`);
  }
  return judicialProcesses;
}

async function createBems(tenantId: string) {
  const bems = [];
  for (let i = 0; i < 50; i++) { // Create 50 bems
    const bem = await prisma.bem.create({
      data: {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        tenantId: tenantId,
        status: faker.helpers.arrayElement(['AVAILABLE', 'IN_AUCTION', 'SOLD']),
      },
    });
    bems.push(bem);
    console.log(`Created bem: ${bem.name}`);
  }
  return bems;
}

async function createMediaItems(lotId: string, isFeatured: boolean = false) {
  const mediaItems = [];
  const numImages = isFeatured ? 1 : faker.number.int({ min: 2, max: 5 });

  for (let i = 0; i < numImages; i++) {
    const imageUrl = faker.image.url();
    const mediaItem = await prisma.mediaItem.create({
      data: {
        fileName: faker.system.fileName(),
        storagePath: imageUrl,
        urlOriginal: imageUrl,
        mimeType: 'image/jpeg',
        linkedLotIds: [lotId],
        title: faker.lorem.sentence(3),
        altText: faker.lorem.sentence(5),
        caption: faker.lorem.sentence(7),
        description: faker.lorem.paragraph(),
      },
    });
    mediaItems.push(mediaItem);
    console.log(`  Created media item for lot ${lotId}: ${mediaItem.fileName}`);
  }
  return mediaItems;
}

async function seed() {
  console.log('Starting extended seeding...');

  const tenant = await createTenant();
  const roles = await createRoles(tenant.id);
  const users = await createUsers(tenant.id, roles);
  const { states, cities, capitals } = await createStatesAndCities(tenant.id);
  const auctioneers = await createAuctioneers(tenant.id, cities);
  const sellers = await createSellers(tenant.id, cities);
  const courts = await createCourts(tenant.id, states);
  const { categories, subcategories } = await createCategoriesAndSubcategories(tenant.id);
  const judicialProcesses = await createJudicialProcesses(tenant.id, cities, courts);
  const bems = await createBems(tenant.id);

  const auctionTypes = ['JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR', 'TOMADA_DE_PRECOS'];
  const auctionMethods = ['STANDARD', 'DUTCH', 'SILENT'];
  const auctionParticipations = ['ONLINE', 'PRESENCIAL', 'HIBRIDO'];
  const auctionStatuses = ['RASCUNHO', 'EM_PREPARACAO', 'EM_BREVE', 'ABERTO', 'ABERTO_PARA_LANCES', 'ENCERRADO', 'FINALIZADO', 'CANCELADO', 'SUSPENSO'];

  // Geographic distribution tracking
  const stateLotCounts: { [key: string]: number } = {};
  states.forEach(s => (stateLotCounts[s.id] = 0));
  const capitalLotCounts: { [key: string]: number } = {};
  capitals.forEach(c => (capitalLotCounts[c.id] = 0));

  // Create a pool of lots to distribute
  const lotsToCreate: any[] = [];

  // Ensure at least 100 lots per state
  for (const state of states) {
    for (let i = 0; i < 100; i++) {
      lotsToCreate.push({ stateId: state.id, isCapital: false });
    }
  }

  // Ensure at least 10 lots per capital
  for (const capital of capitals) {
    for (let i = 0; i < 10; i++) {
      lotsToCreate.push({ cityId: capital.id, isCapital: true });
    }
  }

  // Shuffle the lots to create for better distribution
  faker.helpers.shuffle(lotsToCreate);

  let auctionCounter = 0;
  for (const lotToCreate of lotsToCreate) {
    const type = faker.helpers.arrayElement(auctionTypes);
    const method = faker.helpers.arrayElement(auctionMethods);
    const participation = faker.helpers.arrayElement(auctionParticipations);
    const status = faker.helpers.arrayElement(auctionStatuses);

    const auctioneer = faker.helpers.arrayElement(auctioneers);
    const seller = faker.helpers.arrayElement(sellers);

    let city: any;
    if (lotToCreate.isCapital) {
      city = cities.find((c: any) => c.id === lotToCreate.cityId);
    } else {
      city = faker.helpers.arrayElement(cities.filter((c: any) => c.stateId === lotToCreate.stateId));
    }

    const auction = await prisma.auction.create({
      data: {
        title: faker.lorem.sentence(5),
        description: faker.lorem.paragraph(),
        auctionDate: faker.date.future(),
        endDate: faker.date.future(),
        auctioneerId: auctioneer.id,
        sellerId: seller.id,
        auctionMethod: method as any,
        auctionType: type as any,
        participationForm: participation as any,
        status: status as any,
        cityId: city.id,
        tenantId: tenant.id,
        softCloseEnabled: faker.datatype.boolean(),
        softCloseMinutes: faker.number.int({ min: 1, max: 10 }),
      },
    });
    auctionCounter++;
    console.log(`Created auction ${auctionCounter}: ${auction.title} (Type: ${type}, Method: ${method}, Status: ${status})`);

    // Create 1 to 3 lots for each auction
    for (let j = 0; j < faker.number.int({ min: 1, max: 3 }); j++) {
      const category = faker.helpers.arrayElement(categories);
      const subcategory = faker.helpers.arrayElement(subcategories.filter(s => s.lotCategoryId === category.id));
      const judicialProcess = type === 'JUDICIAL' ? faker.helpers.arrayElement(judicialProcesses) : undefined;

      // Lot Grouping (1:1 or 1:N Bens)
      const numBems = faker.datatype.boolean() ? faker.number.int({ min: 2, max: 5 }) : 1;
      const selectedBems = faker.helpers.arrayElements(bems, numBems);

      const lot = await prisma.lot.create({
        data: {
          auctionId: auction.id,
          title: faker.lorem.sentence(3),
          description: faker.lorem.paragraph(),
          initialPrice: faker.number.float({ min: 1000, max: 100000, precision: 0.01 }),
          secondInitialPrice: faker.number.float({ min: 500, max: 50000, precision: 0.01 }),
          bidIncrementStep: faker.number.float({ min: 50, max: 500, precision: 0.01 }),
          status: faker.helpers.arrayElement(['EM_BREVE', 'ABERTO_PARA_LANCES', 'ENCERRADO']),
          lotCategoryId: category.id,
          subcategoryId: subcategory?.id,
          judicialProcessId: judicialProcess?.id,
          tenantId: tenant.id,
          bems: { connect: selectedBems.map(b => ({ id: b.id })) },
        },
      });
      console.log(`  Created lot: ${lot.title} for auction ${auction.title}`);

      // Create featured image for lot
      await createMediaItems(lot.id, true);

      // Create gallery images for lot
      await createMediaItems(lot.id, false);
    }
  }

  console.log('Extended seeding finished.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });