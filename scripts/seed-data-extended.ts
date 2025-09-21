// scripts/seed-data-extended.ts
import { PrismaClient, UserHabilitationStatus, Prisma } from '@prisma/client';
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
  const roles = ['ADMIN', 'USER', 'AUCTIONEER', 'SELLER'];
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
      habilitationStatus: UserHabilitationStatus.APPROVED,
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
      habilitationStatus: UserHabilitationStatus.PENDING_DOCUMENTS,
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

  // Create a pool of approved bidders
  for (let i = 0; i < 20; i++) {
    const bidderEmail = `bidder${i}@example.com`;
    const bidder = await prisma.user.upsert({
      where: { email: bidderEmail },
      update: {},
      create: {
        email: bidderEmail,
        fullName: faker.person.fullName(),
        password: 'password',
        habilitationStatus: UserHabilitationStatus.APPROVED,
      },
    });
    await prisma.usersOnRoles.upsert({
      where: { userId_roleId: { userId: bidder.id, roleId: userRole.id } },
      update: {},
      create: {
        userId: bidder.id,
        roleId: userRole.id,
        assignedBy: 'seed-script',
      },
    });
    await prisma.usersOnTenants.upsert({
      where: { userId_tenantId: { userId: bidder.id, tenantId: tenantId } },
      update: {},
      create: {
        userId: bidder.id,
        tenantId: tenantId,
      },
    });
    users.push(bidder);
    console.log(`Created bidder user: ${bidder.email}`);
  }

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

    const capitalCity = await prisma.city.upsert({
      where: { name_stateId: { name: stateData.capital, stateId: state.id } },
      update: {},
      create: { name: stateData.capital, stateId: state.id },
    });
    cities.push(capitalCity);
    capitals.push(capitalCity);

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
  for (let i = 0; i < 2; i++) {
    const city = faker.helpers.arrayElement(cities);
    const auctioneer = await prisma.auctioneer.upsert({
      where: { publicId: faker.string.uuid() },
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
  for (let i = 0; i < 20; i++) {
    const city = faker.helpers.arrayElement(cities);
    const companyName = faker.company.name();
    const seller = await prisma.seller.upsert({
      where: { name: companyName },
      update: {},
      create: {
        publicId: faker.string.uuid(),
        slug: faker.lorem.slug(),
        name: companyName,
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

async function createJudicialDistricts(courts: any[], states: any[]) {
    const districts = [];
    for (let i = 0; i < 15; i++) {
        const state = faker.helpers.arrayElement(states);
        const court = faker.helpers.arrayElement(courts);
        const district = await prisma.judicialDistrict.create({
            data: {
                name: `Comarca de ${faker.location.city()}`,
                slug: faker.lorem.slug(),
                stateId: state.id,
                courtId: court.id,
            },
        });
        districts.push(district);
        console.log(`Created judicial district: ${district.name}`);
    }
    return districts;
}

async function createJudicialBranches(districts: any[]) {
    const branches = [];
    for (const district of districts) {
        for (let i = 0; i < faker.number.int({ min: 1, max: 4 }); i++) {
            const branch = await prisma.judicialBranch.create({
                data: {
                    name: `${i + 1}ª Vara Cível`,
                    slug: faker.lorem.slug(),
                    districtId: district.id,
                },
            });
            branches.push(branch);
            console.log(`  Created judicial branch: ${branch.name} for district ${district.name}`);
        }
    }
    return branches;
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

async function createCategoriesAndSubcategories() {
  const categories = [];
  const subcategories = [];

  const vehicles = await prisma.lotCategory.upsert({
    where: { name: 'Veículos' },
    update: {},
    create: { 
      name: 'Veículos',
      slug: 'veiculos'
    },
  });
  categories.push(vehicles);
  subcategories.push(await prisma.subcategory.upsert({
    where: { name_parentCategoryId: { name: 'Carros', parentCategoryId: vehicles.id } },
    update: {},
    create: { 
      name: 'Carros', 
      slug: 'carros',
      parentCategoryId: vehicles.id
    },
  }));
  subcategories.push(await prisma.subcategory.upsert({
    where: { name_parentCategoryId: { name: 'Motos', parentCategoryId: vehicles.id } },
    update: {},
    create: { 
      name: 'Motos', 
      slug: 'motos',
      parentCategoryId: vehicles.id
    },
  }));

  const realEstate = await prisma.lotCategory.upsert({
    where: { name: 'Imóveis' },
    update: {},
    create: { 
      name: 'Imóveis',
      slug: 'imoveis'
     },
  });
  categories.push(realEstate);
  subcategories.push(await prisma.subcategory.upsert({
    where: { name_parentCategoryId: { name: 'Apartamentos', parentCategoryId: realEstate.id } },
    update: {},
    create: { 
      name: 'Apartamentos', 
      slug: 'apartamentos',
      parentCategoryId: realEstate.id
    },
  }));
  subcategories.push(await prisma.subcategory.upsert({
    where: { name_parentCategoryId: { name: 'Casas', parentCategoryId: realEstate.id } },
    update: {},
    create: { 
      name: 'Casas', 
      slug: 'casas',
      parentCategoryId: realEstate.id
    },
  }));

  console.log('Created/found categories and subcategories.');
  return { categories, subcategories };
}

async function createJudicialProcesses(tenantId: string, courts: any[], branches: any[]) {
  const judicialProcesses = [];
  for (let i = 0; i < 10; i++) {
    const court = faker.helpers.arrayElement(courts);
    const branch = faker.helpers.arrayElement(branches);
    const judicialProcess = await prisma.judicialProcess.upsert({
      where: { processNumber_tenantId: { processNumber: faker.string.numeric(7) + '-' + faker.string.numeric(2) + '.' + faker.string.numeric(4) + '.' + faker.string.numeric(1) + '.' + faker.string.numeric(2) + '.' + faker.string.numeric(4), tenantId: tenantId } },
      update: {},
      create: {
        publicId: faker.string.uuid(),
        processNumber: faker.string.numeric(7) + '-' + faker.string.numeric(2) + '.' + faker.string.numeric(4) + '.' + faker.string.numeric(1) + '.' + faker.string.numeric(2) + '.' + faker.string.numeric(4),
        courtId: court.id,
        branchId: branch.id,
        districtId: branch.districtId,
        tenantId: tenantId,
      },
    });
    judicialProcesses.push(judicialProcess);
    await createJudicialParties(judicialProcess.id);
    console.log(`Created judicial process: ${judicialProcess.processNumber}`);
  }
  return judicialProcesses;
}

async function createBems(tenantId: string, categories: any[]) {
  const bems = [];
  for (let i = 0; i < 50; i++) {
    const category = faker.helpers.arrayElement(categories);
    const bem = await prisma.bem.create({
      data: {
        publicId: faker.string.uuid(),
        title: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        tenantId: tenantId,
        categoryId: category.id,
      },
    });
    bems.push(bem);
    console.log(`Created bem: ${bem.title}`);
  }
  return bems;
}

async function createMediaItems(lotId: string, isFeatured: boolean = false) {
  const mediaItems = [];
  const numImages = isFeatured ? 1 : faker.number.int({ min: 5, max: 8 });

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

async function simulateBiddingAndPayments(tenantId: string) {
  console.log('Simulating bidding and payments...');

  const approvedBidders = await prisma.user.findMany({
    where: {
      habilitationStatus: UserHabilitationStatus.APPROVED,
      tenants: {
        some: {
          tenantId: tenantId,
        },
      },
    },
  });

  if (approvedBidders.length === 0) {
    console.log('No approved bidders found. Skipping simulation.');
    return;
  }

  const lotsToBidOn = await prisma.lot.findMany({
    where: {
      auction: {
        status: { in: ['ABERTO_PARA_LANCES', 'ENCERRADO'] },
        tenantId: tenantId,
      },
    },
    include: {
      auction: true,
    },
  });

  for (const lot of lotsToBidOn) {
    // 70% chance of a lot receiving bids
    if (Math.random() > 0.3) {
      const numberOfBids = faker.number.int({ min: 1, max: 15 });
      // Ensure we are working with Decimal objects for precision
      let currentBid = new Prisma.Decimal(lot.initialPrice ?? 1000);
      const bidIncrement = new Prisma.Decimal(lot.bidIncrementStep ?? 100);
      let winner: any = null;

      for (let i = 0; i < numberOfBids; i++) {
        const bidder = faker.helpers.arrayElement(approvedBidders);
        currentBid = currentBid.add(bidIncrement); // Use Decimal's add method

        await prisma.bid.create({
          data: {
            amount: currentBid, // Pass the Decimal object directly
            lotId: lot.id,
            auctionId: lot.auctionId,
            bidderId: bidder.id,
            tenantId: tenantId,
          },
        });
        winner = { id: bidder.id, finalPrice: currentBid };
        console.log(`  Bid placed on lot ${lot.title} by ${bidder.email} for ${currentBid.toFixed(2)}`);
      }

      if (winner && lot.auction.status === 'ENCERRADO') {
        await prisma.lot.update({
          where: { id: lot.id },
          data: {
            status: 'VENDIDO',
            winner: {
              connect: { id: winner.id },
            },
            finalPrice: winner.finalPrice,
          },
        });

        await prisma.userWin.create({
          data: {
            userId: winner.id,
            lotId: lot.id,
            auctionId: lot.auctionId,
            finalPrice: winner.finalPrice,
            paymentStatus: 'PENDING',
            tenantId: tenantId,
          },
        });
        console.log(`  Lot ${lot.title} sold to user ${winner.id} for ${winner.finalPrice.toFixed(2)}`);
      }
    } else {
      if (lot.auction.status === 'ENCERRADO') {
        await prisma.lot.update({
          where: { id: lot.id },
          data: {
            status: 'NAO_VENDIDO',
          },
        });
        console.log(`  Lot ${lot.title} received no bids and was not sold.`);
      }
    }
  }
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
  const districts = await createJudicialDistricts(courts, states);
  const branches = await createJudicialBranches(districts);
  const { categories, subcategories } = await createCategoriesAndSubcategories();
  const judicialProcesses = await createJudicialProcesses(tenant.id, courts, branches);
  const bems = await createBems(tenant.id, categories);

  const auctionTypes = ['JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR', 'TOMADA_DE_PRECOS', 'VENDA_DIRETA'];
  const auctionMethods = ['STANDARD', 'DUTCH', 'SILENT'];
  const auctionParticipations = ['ONLINE', 'PRESENCIAL', 'HIBRIDO'];
  const auctionStatuses = ['RASCUNHO', 'EM_PREPARACAO', 'EM_BREVE', 'ABERTO', 'ABERTO_PARA_LANCES', 'ENCERRADO', 'FINALIZADO', 'CANCELADO', 'SUSPENSO'];

  const stateLotCounts: { [key: string]: number } = {};
  states.forEach(s => (stateLotCounts[s.id] = 0));
  const capitalLotCounts: { [key: string]: number } = {};
  capitals.forEach(c => (capitalLotCounts[c.id] = 0));

  const lotsToCreate: any[] = [];
  const allLotIds: string[] = []; // New: To store all lot IDs for image generation

  for (const state of states) {
    for (let i = 0; i < 5; i++) {
      lotsToCreate.push({ stateId: state.id, isCapital: false });
    }
  }

  for (const capital of capitals) {
    for (let i = 0; i < 2; i++) {
      lotsToCreate.push({ cityId: capital.id, isCapital: true });
    }
  }

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

    // Handle auction dates based on type
    let auctionDate: Date;
    let endDate: Date;
    if (type === 'TOMADA_DE_PRECOS' || type === 'VENDA_DIRETA') {
      auctionDate = faker.date.future({ years: 0.1 }); // Soon
      endDate = faker.date.soon({ days: 7, refDate: auctionDate }); // A week after auctionDate
    } else {
      auctionDate = faker.date.future({ years: 1 });
      endDate = faker.date.future({ years: 1.5 });
    }


    const auction = await prisma.auction.create({
      data: {
        title: faker.lorem.sentence(5),
        description: faker.lorem.paragraph(),
        auctionDate: auctionDate,
        endDate: endDate,
        auctioneerId: auctioneer.id,
        sellerId: seller.id,
        auctionMethod: method as any,
        auctionType: type as any,
        participation: participation as any,
        status: status as any,
        cityId: city.id,
        tenantId: tenant.id,
        softCloseEnabled: faker.datatype.boolean(),
        softCloseMinutes: faker.number.int({ min: 1, max: 10 }),
      },
    });
    auctionCounter++;
    console.log(`Created auction ${auctionCounter}: ${auction.title} (Type: ${type}, Method: ${method}, Status: ${status})`);

    for (let j = 0; j < faker.number.int({ min: 1, max: 3 }); j++) {
      const category = faker.helpers.arrayElement(categories);
      const relevantSubcategories = subcategories.filter(s => s.parentCategoryId === category.id);
      const subcategory = relevantSubcategories.length > 0 ? faker.helpers.arrayElement(relevantSubcategories) : null;

      const numBems = faker.datatype.boolean() ? faker.number.int({ min: 2, max: 5 }) : 1;
      const selectedBems = faker.helpers.arrayElements(bems, numBems);

      // Handle 1 praça / 2 praças
      let initialPrice: number;
      let secondInitialPrice: number | null = null;
      const isTwoPraças = faker.datatype.boolean(); // Randomly decide if it's a 2-praças lot

      if (isTwoPraças) {
        initialPrice = faker.number.float({ min: 10000, max: 100000, multipleOf: 0.01 });
        secondInitialPrice = faker.number.float({ min: initialPrice * 0.5, max: initialPrice * 0.9, multipleOf: 0.01 });
      } else {
        initialPrice = faker.number.float({ min: 1000, max: 50000, multipleOf: 0.01 });
      }

      const lot = await prisma.lot.create({
        data: {
          auctionId: auction.id,
          title: faker.lorem.sentence(3),
          description: faker.lorem.paragraph(),
          initialPrice: initialPrice,
          price: initialPrice, // Current price starts as initial price
          secondInitialPrice: secondInitialPrice,
          bidIncrementStep: faker.number.float({ min: 50, max: 500, multipleOf: 0.01 }),
          status: faker.helpers.arrayElement(['EM_BREVE', 'ABERTO_PARA_LANCES', 'ENCERRADO']),
          categoryId: category.id,
          subcategoryId: subcategory?.id,
          tenantId: tenant.id,
          type: type as any,
        },
      });
      console.log(`  Created lot: ${lot.title} for auction ${auction.title}`);
      allLotIds.push(lot.id); // Store lot ID for later image generation

      if (selectedBems.length > 0) {
        for (const bem of selectedBems) {
            await prisma.lotBens.create({
                data: {
                    lotId: lot.id,
                    bemId: bem.id,
                },
            });
        }
      }

      // Removed direct call to createMediaItems here
    }
  }

  // Generate images for all lots at the end
  console.log('Generating media items for all created lots...');
  for (const lotId of allLotIds) {
    await createMediaItems(lotId, true); // Featured image
    await createMediaItems(lotId, false); // Additional images
  }

  // This is the new function call
  await simulateBiddingAndPayments(tenant.id);

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