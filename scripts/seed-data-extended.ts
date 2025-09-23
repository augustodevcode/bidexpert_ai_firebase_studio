// scripts/seed-data-extended.ts
import { PrismaClient, UserHabilitationStatus, Prisma, PaymentStatus } from '@prisma/client';
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

async function createRoles() {
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
      password: 'password', // Em um projeto real, use hash
      habilitationStatus: 'HABILITADO',
    },
  });
  await prisma.usersOnRoles.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id, assignedBy: 'seed-script' },
  });
  await prisma.usersOnTenants.upsert({
    where: { userId_tenantId: { userId: adminUser.id, tenantId: tenantId } },
    update: {},
    create: { userId: adminUser.id, tenantId: tenantId },
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
      habilitationStatus: 'PENDING_DOCUMENTS',
    },
  });
  await prisma.usersOnRoles.upsert({
    where: { userId_roleId: { userId: regularUser.id, roleId: userRole.id } },
    update: {},
    create: { userId: regularUser.id, roleId: userRole.id, assignedBy: 'seed-script' },
  });
  await prisma.usersOnTenants.upsert({
    where: { userId_tenantId: { userId: regularUser.id, tenantId: tenantId } },
    update: {},
    create: { userId: regularUser.id, tenantId: tenantId },
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
        habilitationStatus: 'HABILITADO',
      },
    });
    await prisma.usersOnRoles.upsert({
        where: { userId_roleId: { userId: bidder.id, roleId: userRole.id } },
        update: {},
        create: { userId: bidder.id, roleId: userRole.id, assignedBy: 'seed-script' },
    });
    await prisma.usersOnTenants.upsert({
        where: { userId_tenantId: { userId: bidder.id, tenantId: tenantId } },
        update: {},
        create: { userId: bidder.id, tenantId: tenantId },
    });
    users.push(bidder);
    console.log(`Created bidder user: ${bidder.email}`);
  }

  return users;
}

async function createStatesAndCities() {
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

  for (const stateData of statesData) {
    const state = await prisma.state.upsert({
      where: { uf: stateData.uf },
      update: {},
      create: { uf: stateData.uf, name: stateData.name, slug: stateData.name.toLowerCase() },
    });
    states.push(state);

    const capitalCity = await prisma.city.upsert({
      where: { name_stateId: { name: stateData.capital, stateId: state.id } },
      update: {},
      create: { name: stateData.capital, stateId: state.id, slug: stateData.capital.toLowerCase() },
    });
    cities.push(capitalCity);
  }

  console.log('Created/found states and cities.');
  return { states, cities };
}

async function createAuctioneers(tenantId: string) {
  const auctioneers = [];
  for (let i = 0; i < 5; i++) {
    const name = faker.person.fullName();
    const slug = faker.helpers.slugify(name).toLowerCase();
    const auctioneer = await prisma.auctioneer.upsert({
      where: { slug: slug },
      update: {},
      create: {
        publicId: faker.string.uuid(),
        slug: slug,
        name: name,
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        tenantId: tenantId,
      },
    });
    auctioneers.push(auctioneer);
    console.log(`Created auctioneer: ${auctioneer.name}`);
  }
  return auctioneers;
}

async function createSellers(tenantId: string) {
  const sellers = [];
  for (let i = 0; i < 10; i++) {
    const name = faker.company.name();
    const slug = faker.helpers.slugify(name).toLowerCase();
    const seller = await prisma.seller.upsert({
      where: { slug: slug },
      update: {},
      create: {
        publicId: faker.string.uuid(),
        slug: slug,
        name: name,
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        tenantId: tenantId,
      },
    });
    sellers.push(seller);
    console.log(`Created seller: ${seller.name}`);
  }
  return sellers;
}

async function createCourts(states: any[]) {
  const courts = [];
  for (const state of states) {
    const slug = `tj-${state.uf.toLowerCase()}`;
    const court = await prisma.court.upsert({
      where: { slug: slug },
      update: {},
      create: {
        name: `Tribunal de Justiça de ${state.name}`,
        slug: slug,
        stateUf: state.uf,
        website: faker.internet.url(),
      },
    });
    courts.push(court);
  }
  console.log('Created courts.');
  return courts;
}

async function createJudicialDistricts(courts: any[], cities: any[]) {
    const districts = [];
    for (let i = 0; i < 15; i++) {
        const city = faker.helpers.arrayElement(cities);
        const court = courts.find(c => c.stateUf === city.state.uf);
        const name = `Comarca de ${city.name}`;
        const district = await prisma.judicialDistrict.upsert({
            where: { name: name },
            update: {},
            create: {
                name: name,
                slug: faker.helpers.slugify(name).toLowerCase(),
                stateId: city.stateId,
                courtId: court?.id,
            },
        });
        districts.push(district);
    }
    console.log('Created judicial districts.');
    return districts;
}

async function createJudicialBranches(districts: any[]) {
    const branches = [];
    for (const district of districts) {
        for (let i = 0; i < faker.number.int({ min: 1, max: 3 }); i++) {
            const name = `${i + 1}ª Vara Cível de ${district.name}`;
            const branch = await prisma.judicialBranch.upsert({
                where: { name: name },
                update: {},
                create: {
                    name: name,
                    slug: faker.helpers.slugify(name).toLowerCase(),
                    districtId: district.id,
                },
            });
            branches.push(branch);
        }
    }
    console.log('Created judicial branches.');
    return branches;
}

async function createCategoriesAndSubcategories() {
  const categoriesData = [
    { name: 'Imóveis', slug: 'imoveis', sub: ['Apartamentos', 'Casas', 'Terrenos'] },
    { name: 'Veículos', slug: 'veiculos', sub: ['Carros', 'Motos', 'Caminhões'] },
    { name: 'Eletrônicos', slug: 'eletronicos', sub: ['Celulares', 'Notebooks', 'TVs'] },
  ];
  const categories = [];
  const subcategories = [];

  for (const catData of categoriesData) {
    const category = await prisma.lotCategory.upsert({
      where: { slug: catData.slug },
      update: {},
      create: { name: catData.name, slug: catData.slug },
    });
    categories.push(category);

    for (const subName of catData.sub) {
      const sub = await prisma.subcategory.upsert({
        where: { name_parentCategoryId: { name: subName, parentCategoryId: category.id } },
        update: {},
        create: { name: subName, slug: subName.toLowerCase(), parentCategoryId: category.id },
      });
      subcategories.push(sub);
    }
  }
  console.log('Created categories and subcategories.');
  return { categories, subcategories };
}

async function createJudicialProcesses(tenantId: string, courts: any[], branches: any[], sellers: any[]) {
  const judicialProcesses = [];
  for (let i = 0; i < 10; i++) {
    const branch = faker.helpers.arrayElement(branches);
    const processNumber = faker.string.numeric(20);
    const judicialProcess = await prisma.judicialProcess.upsert({
      where: { processNumber_tenantId: { processNumber: processNumber, tenantId: tenantId } },
      update: {},
      create: {
        publicId: faker.string.uuid(),
        processNumber: processNumber,
        tenantId: tenantId,
        courtId: faker.helpers.arrayElement(courts).id,
        branchId: branch.id,
        districtId: branch.districtId,
        sellerId: faker.helpers.arrayElement(sellers).id,
      },
    });
    judicialProcesses.push(judicialProcess);
  }
  console.log('Created judicial processes.');
  return judicialProcesses;
}

async function createBems(tenantId: string, categories: any[], judicialProcesses: any[]) {
  const bems = [];
  for (let i = 0; i < 50; i++) {
    const title = faker.commerce.productName();
    const bem = await prisma.bem.upsert({
        where: { title: title },
        update: {},
        create: {
            publicId: faker.string.uuid(),
            title: title,
            description: faker.lorem.paragraph(),
            evaluationValue: faker.number.float({ min: 100, max: 100000 }),
            status: 'DISPONIVEL',
            tenantId: tenantId,
            categoryId: faker.helpers.arrayElement(categories).id,
            judicialProcessId: faker.helpers.arrayElement(judicialProcesses).id,
        }
    });
    bems.push(bem);
  }
  console.log('Created bems.');
  return bems;
}

async function createVehicleData() {
    const makes = ['Ford', 'Chevrolet', 'Honda', 'Toyota', 'BMW'].map(name => ({ name, slug: name.toLowerCase() }));
    const vehicleMakes = [];
    for(const makeData of makes) {
        const newMake = await prisma.vehicleMake.upsert({
            where: { name: makeData.name },
            update: {},
            create: makeData,
        });
        vehicleMakes.push(newMake);
    }

    const models = {
        'Ford': ['Fiesta', 'Focus', 'Mustang'],
        'Chevrolet': ['Onix', 'Cruze', 'S10'],
        'Honda': ['Civic', 'Fit', 'HR-V'],
        'Toyota': ['Corolla', 'Hilux', 'Yaris'],
        'BMW': ['320i', 'X1', 'M3']
    };
    const vehicleModels = [];
    for(const make of vehicleMakes) {
        for(const modelName of models[make.name]) {
            const newModel = await prisma.vehicleModel.upsert({
                where: { makeId_name: { makeId: make.id, name: modelName } },
                update: {},
                create: {
                    name: modelName,
                    slug: modelName.toLowerCase(),
                    makeId: make.id,
                }
            });
            vehicleModels.push(newModel);
        }
    }
    console.log('Created/updated vehicle makes and models.');
    return { vehicleMakes, vehicleModels };
}

async function createDocumentData() {
    const docTypes = [
        { name: 'RG', description: 'Registro Geral', isRequired: true, appliesTo: 'PHYSICAL' },
        { name: 'CNH', description: 'Carteira Nacional de Habilitação', isRequired: true, appliesTo: 'PHYSICAL' },
        { name: 'Contrato Social', description: 'Contrato Social da Empresa', isRequired: true, appliesTo: 'LEGAL' },
    ];
    const documentTypes = [];
    for(const type of docTypes) {
        const newDocType = await prisma.documentType.upsert({ 
            where: { name: type.name },
            update: {},
            create: type 
        });
        documentTypes.push(newDocType);
    }

    const docTemplates = [
        { name: 'Termo de Arrematação Padrão', type: 'WINNING_BID_TERM', content: '<h1>Termo de Arrematação</h1><p>Conteúdo do termo...</p>' },
        { name: 'Certificado de Leilão', type: 'AUCTION_CERTIFICATE', content: '<h1>Certificado</h1><p>Conteúdo do certificado...</p>' },
    ];
    const documentTemplates = [];
    for(const template of docTemplates) {
        const newDocTemplate = await prisma.documentTemplate.upsert({ 
            where: { name: template.name },
            update: {},
            create: template 
        });
        documentTemplates.push(newDocTemplate);
    }
    console.log('Created/updated document types and templates.');
    return { documentTypes, documentTemplates };
}

async function createPlatformSettings(tenantId: string) {
    await prisma.platformSettings.upsert({
        where: { id: 'global' },
        update: {
            siteTitle: 'BidExpert Leilões',
            tenantId: tenantId,
        },
        create: {
            id: 'global',
            tenantId: tenantId,
            siteTitle: 'BidExpert Leilões',
            paymentGatewaySettings: { commissionPercentage: 5 },
        }
    });
    console.log('Created/updated platform settings.');
}

async function createDirectSaleOffers(tenantId: string, sellers: any[], categories: any[]) {
    for (let i = 0; i < 5; i++) {
        const publicId = faker.string.uuid();
        await prisma.directSaleOffer.upsert({
            where: { publicId: publicId },
            update: {},
            create: {
                publicId: publicId,
                title: `Venda Direta: ${faker.commerce.productName()}`,
                price: faker.number.float({ min: 500, max: 5000 }),
                status: 'ACTIVE',
                offerType: 'BUY_NOW',
                tenantId: tenantId,
                sellerId: faker.helpers.arrayElement(sellers).id,
                categoryId: faker.helpers.arrayElement(categories).id,
            }
        });
    }
    console.log('Created direct sale offers.');
}

async function createMiscData(users: any[]) {
    // Contact Messages
    for (let i = 0; i < 10; i++) {
        await prisma.contactMessage.create({
            data: {
                name: faker.person.fullName(),
                email: faker.internet.email(),
                subject: faker.lorem.sentence(),
                message: faker.lorem.paragraph(),
            }
        });
    }
    // Password Reset Tokens
    if (users.length > 0) {
        const user = faker.helpers.arrayElement(users);
        const token = faker.string.uuid();
        await prisma.passwordResetToken.upsert({
            where: { token: token },
            update: {},
            create: {
                email: user.email,
                token: token,
                expires: faker.date.future(),
            }
        });
    }
    console.log('Created misc data (contacts, tokens).');
}

async function createNotifications(tenantId: string, users: any[]) {
    for(const user of users) {
        if(Math.random() > 0.5) { // 50% chance of getting a notification
            await prisma.notification.create({
                data: {
                    message: 'Seu lance foi superado no lote X!',
                    link: '/dashboard/bids',
                    userId: user.id,
                    tenantId: tenantId,
                }
            });
        }
    }
    console.log('Created notifications.');
}

async function simulatePostBidding(tenantId: string) {
    const wins = await prisma.userWin.findMany({ include: { lot: true } });

    for (const win of wins) {
        // Create Installment Payments for some wins
        if (Math.random() > 0.7) {
            const totalAmount = win.winningBidAmount;
            const installmentCount = 3;
            const installmentAmount = new Prisma.Decimal(totalAmount.toNumber() / installmentCount);

            for (let i = 1; i <= installmentCount; i++) {
                const installment = await prisma.installmentPayment.create({
                    data: {
                        userWinId: win.id,
                        installmentNumber: i,
                        amount: installmentAmount,
                        dueDate: faker.date.future({ years: i/12 }),
                        status: i === 1 ? 'PAGO' : 'PENDENTE',
                    }
                });
                // Create join table entry
                await prisma.$executeRaw`INSERT INTO _InstallmentPaymentToLot (A, B) VALUES (${installment.id}, ${win.lotId}) ON DUPLICATE KEY UPDATE A=A`;
            }
            console.log(`Created ${installmentCount} installments for win ${win.id}`);
        }

        // Create Reviews for some lots
        if (Math.random() > 0.5) {
            await prisma.review.create({
                data: {
                    rating: faker.number.int({ min: 4, max: 5 }),
                    comment: faker.lorem.sentence(),
                    lotId: win.lotId,
                    auctionId: win.lot.auctionId,
                    userId: win.userId,
                }
            });
            console.log(`Created review for lot ${win.lotId}`);
        }
    }
}


async function seed() {
  console.log('Starting extended seeding...');

  const tenant = await createTenant();
  
  // Independent tables
  const roles = await createRoles();
  const { states, cities } = await createStatesAndCities();
  const { categories, subcategories } = await createCategoriesAndSubcategories();
  await createVehicleData();
  const { documentTypes } = await createDocumentData();
  await createPlatformSettings(tenant.id);
  
  // Dependent tables
  const users = await createUsers(tenant.id, roles);
  await createMiscData(users);
  await createNotifications(tenant.id, users);
  const auctioneers = await createAuctioneers(tenant.id);
  const sellers = await createSellers(tenant.id);
  const courts = await createCourts(states);
  const cityWithState = cities.map(c => ({...c, state: states.find(s => s.id === c.stateId)}));
  const districts = await createJudicialDistricts(courts, cityWithState);
  const branches = await createJudicialBranches(districts);
  const judicialProcesses = await createJudicialProcesses(tenant.id, courts, branches, sellers);
  const bems = await createBems(tenant.id, categories, judicialProcesses);
  await createDirectSaleOffers(tenant.id, sellers, categories);

  const allAuctions = [];
  const allLots = [];

  // Create Auctions and Lots
  for (let i = 0; i < 15; i++) {
    const auction = await prisma.auction.create({
      data: {
        title: `Leilão ${faker.commerce.department()} ${i + 1}`,
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(['ABERTO_PARA_LANCES', 'EM_BREVE', 'ENCERRADO']),
        auctionDate: faker.date.soon(),
        endDate: faker.date.future(),
        tenantId: tenant.id,
        auctioneerId: faker.helpers.arrayElement(auctioneers).id,
        sellerId: faker.helpers.arrayElement(sellers).id,
        cityId: faker.helpers.arrayElement(cities).id,
      },
    });
    allAuctions.push(auction);
    console.log(`Created auction: ${auction.title}`);

    // Habilitate some users for this auction
    for(const user of faker.helpers.arrayElements(users, 5)) {
        await prisma.auctionHabilitation.create({
            data: { auctionId: auction.id, userId: user.id }
        });
    }

    for (let j = 0; j < faker.number.int({ min: 2, max: 8 }); j++) {
      const lot = await prisma.lot.create({
        data: {
          auctionId: auction.id,
          number: `${j + 1}`,
          title: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          initialPrice: faker.number.float({ min: 100, max: 10000 }),
          price: 0,
          status: 'EM_BREVE',
          tenantId: tenant.id,
          categoryId: faker.helpers.arrayElement(categories).id,
          type: 'JUDICIAL',
        },
      });
      allLots.push(lot);
      console.log(`  Created lot: ${lot.title}`);

      // Create LotBens
      await prisma.lotBens.create({
          data: { lotId: lot.id, bemId: faker.helpers.arrayElement(bems).id }
      });

      // Create LotQuestions
      if(Math.random() > 0.5) {
          const questionUser = faker.helpers.arrayElement(users);
          await prisma.lotQuestion.create({
              data: {
                  questionText: 'Qual o estado de conservação?',
                  answerText: 'Em bom estado, com marcas de uso.',
                  lotId: lot.id,
                  auctionId: auction.id,
                  userId: questionUser.id,
                  userDisplayName: questionUser.fullName,
              }
          });
      }
      
      // Create UserLotMaxBid
      if(Math.random() > 0.5) {
          await prisma.userLotMaxBid.create({
              data: {
                  maxAmount: faker.number.float({ min: 5000, max: 20000 }),
                  lotId: lot.id,
                  userId: faker.helpers.arrayElement(users).id,
              }
          });
      }
    }
  }
  
  // Simulate Bidding
  console.log('Simulating Bidding...');
  const bidders = users.filter(u => u.habilitationStatus === 'HABILITADO');

  if (bidders.length === 0) {
    console.log('No habilitated bidders found. Skipping bidding simulation.');
  } else {
    const lotsToBidOn = allLots.filter(l => l.status !== 'ENCERRADO');
    for (const lot of lotsToBidOn) {
        let currentBid = new Prisma.Decimal(lot.initialPrice ?? 100);
        for(let i=0; i < faker.number.int({min: 0, max: 15}); i++) {
            const bidder = faker.helpers.arrayElement(bidders);
            currentBid = currentBid.add(100);
            await prisma.bid.create({
                data: {
                    amount: currentBid,
                    lotId: lot.id,
                    auctionId: lot.auctionId,
                    bidderId: bidder.id,
                    tenantId: tenant.id,
                }
            });
        }
        // Assign winner
        const winningBid = await prisma.bid.findFirst({ where: { lotId: lot.id }, orderBy: { amount: 'desc' }});
        if (winningBid) {
            await prisma.lot.update({
                where: { id: lot.id },
                data: { status: 'VENDIDO', winnerId: winningBid.bidderId, price: winningBid.amount }
            });
            await prisma.userWin.create({
                data: {
                    userId: winningBid.bidderId,
                    lotId: lot.id,
                    winningBidAmount: winningBid.amount,
                    paymentStatus: 'PENDENTE',
                }
            });
        }
    }
    console.log('Simulated bidding and assigned winners.');
  }

  await simulatePostBidding(tenant.id);

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
