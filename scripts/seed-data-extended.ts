// scripts/seed-data-extended.ts
import { PrismaClient, Prisma, AuctionType, AssetStatus, LotStatus, AuctionStatus, AuctionMethod, Participation } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { seedGeminiExtended } from './seed-data-extended-gemini';
import fs from 'fs';
import https from 'https';
import path from 'path';

const prisma = new PrismaClient();

// =================================================================
// SEED CONFIGURATION
// =================================================================
const seedConfig = {
  users: {
    bidders: 15,
  },
  sellers: 10,
  auctioneers: 5,
  judicial: {
    courts: 5,
    districts: 10,
    branches: 10,
    processes: 20,
  },
  assets: {
    totalPerCategory: 10,
    judicialRatio: 0.4,
  },
  auctions: {
    total: 20,
    lotsPerAuction: 5,
  },
  bids: {
    perLot: 15,
  },
  media: {
    imagesToDownload: 50,
  },
  installmentPayments: {
    perUserWin: 3,
  }
};

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// =================================================================
// SEEDING SCRIPT
// =================================================================

async function main() {
  console.log('Starting extended seeding with controlled scenarios...');

  // --- 0. SETUP ---
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // --- 1. FETCH PRESERVED DATA ---
  console.log('Fetching preserved data (Tenant, Admin User, Roles)...');
  const tenant = await prisma.tenant.findUnique({ where: { id: '1' } });
  if (!tenant) {
    console.error('Tenant with ID 1 not found. Please ensure it exists.');
    return;
  }
  console.log(`Using tenant: ${tenant.name}`);

  const createdRoles = await createRoles();
  const adminRole = createdRoles.find(r => r.nameNormalized === 'ADMIN');
  const userRole = createdRoles.find(r => r.nameNormalized === 'USER');

  if (!adminRole || !userRole) {
    console.error('Core roles (ADMIN, USER) not found after creation.');
    return;
  }

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@bidexpert.com.br' } });
  if (!adminUser) {
    console.error('Admin user admin@bidexpert.com.br not found.');
    return;
  }
  console.log(`Using admin user: ${adminUser.email}`);

  await prisma.usersOnRoles.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id, assignedBy: 'seed-script' },
  });
  console.log('Ensured admin user has ADMIN role.');

  // --- 2. CREATE NEW DATA ---
  console.log('Creating new data based on configuration...');

  const { states, cities } = await createStatesAndCities();
  const capitalCities = cities.filter(c => states.some(s => s.capital === c.name));

  const mediaItems = await createMediaItems(seedConfig.media.imagesToDownload, tenant.id);
  if (mediaItems.length === 0) {
    console.error("No media items were created. Aborting seed.");
    return;
  }

  const bidders = await createBidders(tenant.id, userRole.id, seedConfig.users.bidders, cities);
  const { categories, subcategories } = await createCategoriesAndSubcategories();
  const sellers = await createSellers(tenant.id, seedConfig.sellers, cities);
  const auctioneers = await createAuctioneers(tenant.id, seedConfig.auctioneers, cities);

  // Judicial Entities
  const courts = await createCourts(states, seedConfig.judicial.courts);
  const districts = await createJudicialDistricts(courts, cities, seedConfig.judicial.districts);
  const branches = await createJudicialBranches(districts, seedConfig.judicial.branches);
  const judicialProcesses = await createJudicialProcesses(tenant.id, courts, branches, sellers, seedConfig.judicial.processes);

  // --- 3. CREATE ASSETS ---
  console.log('Creating assets...');
  const createdAssets = await createAssets(tenant.id, categories, subcategories, judicialProcesses, sellers, cities, mediaItems);
  console.log(`Created ${createdAssets.length} assets.`);

  let availableAssets = [...createdAssets];

  // --- 4. CREATE AUCTIONS, LOTS, STAGES, AND BIDS ---
  console.log('Creating auctions, lots, stages, and bids...');
  let allCreatedAuctions = [];
  let allCreatedLots = [];

  for (let i = 0; i < seedConfig.auctions.total; i++) {
    const type = faker.helpers.arrayElement(Object.values(AuctionType));
    const isJudicial = type === AuctionType.JUDICIAL;

    const suitableAssets = availableAssets.filter(a => (isJudicial ? !!a.judicialProcessId : !a.judicialProcessId) && a.status === AssetStatus.DISPONIVEL);

    if (suitableAssets.length < seedConfig.auctions.lotsPerAuction) {
      console.warn(`Not enough available ${type} assets to create a full auction. Skipping.`);
      continue;
    }

    const auction = await createAuction(tenant.id, auctioneers, sellers, cities, type, `Leilão ${type} de Teste ${i + 1}`, courts, districts, branches);
    allCreatedAuctions.push(auction);

    const lots = await createLotsForAuction(auction, suitableAssets.slice(0, seedConfig.auctions.lotsPerAuction), cities, mediaItems);
    allCreatedLots.push(...lots);

    const lottedAssetIds = lots.flatMap(l => l.assets.map(a => a.assetId));
    availableAssets = availableAssets.filter(a => !lottedAssetIds.includes(a.id));

    await createAuctionStages([auction]);
    await createBidsForLots(lots, bidders, seedConfig.bids.perLot);

    console.log(`Created ${type} auction "${auction.title}" with ${lots.length} lots, stages, and bids.`);
  }
  
  // Ensure some auctions cover all statuses
  const allStatuses = Object.values(AuctionStatus);
  for(const status of allStatuses) {
      const auction = allCreatedAuctions.find(a => a.status === status);
      if (!auction) {
          const newAuction = await createAuction(tenant.id, auctioneers, sellers, cities, AuctionType.EXTRAJUDICIAL, `Leilão Status ${status}`, courts, districts, branches, status);
          allCreatedAuctions.push(newAuction);
          console.log(`Created auction with specific status: ${status}`);
      }
  }


  // --- 5. CREATE USER WINS AND PAYMENTS ---
  console.log('Creating user wins and installment payments...');
  const closedLots = allCreatedLots.filter(l => l.status === LotStatus.ENCERRADO || l.status === LotStatus.VENDIDO);
  const userWins = await createUserWins(bidders, closedLots);
  await createInstallmentPayments(userWins, seedConfig.installmentPayments.perUserWin);

  console.log('\nSeeding finished successfully!');
  await seedGeminiExtended();
}

// =================================================================
// DATA CREATION FUNCTIONS
// =================================================================

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
  }
  console.log(`Created/found ${createdRoles.length} roles.`);
  return createdRoles;
}

async function createBidders(tenantId: string, userRoleId: string, count: number, cities: any[]) {
    const bidders = [];
    for (let i = 0; i < count; i++) {
        const city = faker.helpers.arrayElement(cities);
        const bidderEmail = `bidder${i}@example.com`;
        const bidder = await prisma.user.upsert({
            where: { email: bidderEmail },
            update: {},
            create: {
                email: bidderEmail,
                fullName: faker.person.fullName(),
                password: 'password', // In a real app, this should be hashed
                habilitationStatus: 'HABILITADO',
                cpf: faker.string.numeric(11),
                cellPhone: faker.phone.number('## #####-####'),
                zipCode: city.zipCode,
                street: faker.location.street(),
                number: faker.location.buildingNumber(),
                complement: faker.location.secondaryAddress(),
                neighborhood: faker.location.county(),
                city: city.name,
                state: city.stateId,
            },
        });
        await prisma.usersOnRoles.upsert({
            where: { userId_roleId: { userId: bidder.id, roleId: userRoleId } },
            update: {},
            create: { userId: bidder.id, roleId: userRoleId, assignedBy: 'seed-script' },
        });
        await prisma.usersOnTenants.upsert({
            where: { userId_tenantId: { userId: bidder.id, tenantId: tenantId } },
            update: {},
            create: { userId: bidder.id, tenantId: tenantId },
        });
        bidders.push(bidder);
    }
    console.log(`Created/updated ${bidders.length} bidder users.`);
    return bidders;
}

async function createSellers(tenantId: string, count: number, cities: any[]) {
  const sellers = [];
  for (let i = 0; i < count; i++) {
    const name = faker.company.name();
    const slug = faker.helpers.slugify(name).toLowerCase();
    const city = faker.helpers.arrayElement(cities);
    const seller = await prisma.seller.create({
      data: {
        publicId: faker.string.uuid(),
        slug: `${slug}-${i}`,
        name: name,
        email: faker.internet.email(),
        tenantId: tenantId,
        isJudicial: faker.datatype.boolean(),
        phone: faker.phone.number('## #####-####'),
        address: faker.location.streetAddress(),
        city: city.name,
        state: city.stateId,
        zipCode: city.zipCode,
      },
    });
    sellers.push(seller);
  }
  console.log(`Created ${sellers.length} sellers.`);
  return sellers;
}

async function createAuctioneers(tenantId: string, count: number, cities: any[]) {
  const auctioneers = [];
  for (let i = 0; i < count; i++) {
    const name = faker.person.fullName();
    const slug = faker.helpers.slugify(name).toLowerCase();
    const city = faker.helpers.arrayElement(cities);
    const auctioneer = await prisma.auctioneer.create({
      data: {
        publicId: faker.string.uuid(),
        slug: `${slug}-${i}`,
        name: name,
        email: faker.internet.email(),
        tenantId: tenantId,
        phone: faker.phone.number('## #####-####'),
        address: faker.location.streetAddress(),
        city: city.name,
        state: city.stateId,
        zipCode: city.zipCode,
      },
    });
    auctioneers.push(auctioneer);
  }
  console.log(`Created ${auctioneers.length} auctioneers.`);
  return auctioneers;
}

async function createAssets(tenantId: string, categories: any[], subcategories: any[], judicialProcesses: any[], sellers: any[], cities: any[], mediaItems: any[]) {
  const assets = [];
  const categoryMap = new Map(categories.map(c => [c.slug, c]));

  const assetCreators = {
    VEICULO: (category, subcategory) => ({
      title: `Veículo ${faker.vehicle.manufacturer()} ${faker.vehicle.model()}`,
      description: faker.lorem.paragraph(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      plate: faker.vehicle.vrm(),
      make: faker.vehicle.manufacturer(),
      model: faker.vehicle.model(),
      year: faker.number.int({ min: 2010, max: 2023 }),
      color: faker.vehicle.color(),
      fuelType: faker.helpers.arrayElement(['Gasolina', 'Etanol', 'Flex', 'Diesel', 'Elétrico']),
      transmissionType: faker.helpers.arrayElement(['Manual', 'Automático']),
      bodyType: faker.helpers.arrayElement(['Sedan', 'Hatch', 'SUV', 'Picape']),
      vin: faker.vehicle.vin(),
      renavam: faker.string.numeric(11),
      enginePower: `${faker.number.int({ min: 100, max: 300 })} HP`,
      numberOfDoors: faker.helpers.arrayElement([2, 4]),
      runningCondition: 'Bom',
      bodyCondition: 'Bom',
      tiresCondition: 'Bom',
      hasKey: true,
    }),
    IMOVEL: (category, subcategory) => ({
      title: `Imóvel em ${faker.location.city()}`,
      description: faker.lorem.paragraph(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      propertyRegistrationNumber: faker.string.numeric(10),
      iptuNumber: faker.string.numeric(10),
      isOccupied: faker.datatype.boolean(),
      totalArea: faker.number.float({ min: 50, max: 500, precision: 2 }),
      builtArea: faker.number.float({ min: 30, max: 300, precision: 2 }),
      bedrooms: faker.number.int({ min: 1, max: 5 }),
      suites: faker.number.int({ min: 0, max: 3 }),
      bathrooms: faker.number.int({ min: 1, max: 4 }),
      parkingSpaces: faker.number.int({ min: 0, max: 4 }),
      constructionType: 'Alvenaria',
      hasHabiteSe: true,
      zoningRestrictions: 'Residencial',
      amenities: '[]',
    }),
    SEMOVENTE: (category, subcategory) => ({
        title: `Lote de Gado Nelore`,
        description: faker.lorem.paragraph(),
        categoryId: category.id,
        subcategoryId: subcategory.id,
        breed: 'Nelore',
        age: '24 meses',
        sex: 'Macho',
        weight: '500 kg',
        individualId: faker.string.numeric(10),
        purpose: 'Corte',
        isPregnant: false,
    }),
  };

  const assetTypes = Object.keys(assetCreators);
  const totalAssetsToCreate = seedConfig.assets.totalPerCategory * assetTypes.length;
  const numJudicial = Math.floor(totalAssetsToCreate * seedConfig.assets.judicialRatio);

  for (let i = 0; i < totalAssetsToCreate; i++) {
    const assetTypeSlug = faker.helpers.arrayElement(assetTypes);
    const category = categoryMap.get(assetTypeSlug.toLowerCase());
    if (!category) continue;
    const subcategory = faker.helpers.arrayElement(subcategories.filter(s => s.parentCategoryId === category.id));
    if (!subcategory) continue;

    const assetData = assetCreators[assetTypeSlug](category, subcategory);
    const isJudicial = assets.filter(a => a.judicialProcessId).length < numJudicial;
    const randomCity = faker.helpers.arrayElement(cities);
    const assetMedia = faker.helpers.arrayElement(mediaItems);

    const finalAssetData: Prisma.AssetCreateInput = {
        ...assetData,
        publicId: faker.string.uuid(),
        evaluationValue: faker.number.float({ min: 1000, max: 150000, precision: 2 }),
        status: AssetStatus.DISPONIVEL,
        tenant: { connect: { id: tenantId } },
        judicialProcess: isJudicial && judicialProcesses.length > 0 ? { connect: { id: faker.helpers.arrayElement(judicialProcesses).id } } : undefined,
        seller: !isJudicial && sellers.length > 0 ? { connect: { id: faker.helpers.arrayElement(sellers).id } } : undefined,
        imageUrl: assetMedia.url,
        imageMediaId: assetMedia.id,
        galleryImageUrls: [assetMedia.url],
        mediaItemIds: [assetMedia.id],
        locationCity: randomCity.name,
        locationState: randomCity.stateId,
        address: faker.location.streetAddress(),
        zipCode: randomCity.zipCode,
        latitude: parseFloat(faker.location.latitude()),
        longitude: parseFloat(faker.location.longitude()),
    };

    const asset = await prisma.asset.create({ data: finalAssetData });
    assets.push(asset);
  }

  return assets;
}

async function createAuction(tenantId: string, auctioneers: any[], sellers: any[], cities: any[], type: AuctionType, title: string, courts: any[], districts: any[], branches: any[], status?: AuctionStatus) {
    const randomCity = faker.helpers.arrayElement(cities);
    const isJudicial = type === AuctionType.JUDICIAL;
    const auctionStatus = status || faker.helpers.arrayElement(Object.values(AuctionStatus).filter(s => s !== 'RASCUNHO'));

    const auction = await prisma.auction.create({
      data: {
        title: `${title} #${faker.string.uuid().substring(0, 4)}`,
        description: faker.lorem.paragraph(),
        status: auctionStatus,
        auctionDate: faker.date.soon(),
        endDate: faker.date.future(),
        auctionType: type,
        auctionMethod: faker.helpers.arrayElement(Object.values(AuctionMethod)),
        participation: faker.helpers.arrayElement(Object.values(Participation)),
        onlineUrl: faker.internet.url(),
        address: faker.location.streetAddress(),
        zipCode: randomCity.zipCode,
        latitude: parseFloat(faker.location.latitude()),
        longitude: parseFloat(faker.location.longitude()),
        softCloseEnabled: true,
        softCloseMinutes: 2,
        tenant: { connect: { id: tenantId } },
        auctioneer: { connect: { id: faker.helpers.arrayElement(auctioneers).id } },
        seller: !isJudicial && sellers.length > 0 ? { connect: { id: faker.helpers.arrayElement(sellers).id } } : undefined,
        city: { connect: { id: randomCity.id } },
        state: { connect: { id: randomCity.stateId } },
        court: isJudicial && courts.length > 0 ? { connect: { id: faker.helpers.arrayElement(courts).id } } : undefined,
        district: isJudicial && districts.length > 0 ? { connect: { id: faker.helpers.arrayElement(districts).id } } : undefined,
        branch: isJudicial && branches.length > 0 ? { connect: { id: faker.helpers.arrayElement(branches).id } } : undefined,
      },
    });
    return auction;
}

async function createLotsForAuction(auction: any, assetsForAuction: any[], cities: any[], mediaItems: any[]) {
    const createdLots = [];

    for (let i = 0; i < assetsForAuction.length; i++) {
        const asset = assetsForAuction[i];
        const randomCity = faker.helpers.arrayElement(cities);
        const assetMedia = faker.helpers.arrayElement(mediaItems);

        let lotStatus: LotStatus;
        switch (auction.status) {
            case AuctionStatus.ABERTO_PARA_LANCES:
                lotStatus = LotStatus.ABERTO;
                break;
            case AuctionStatus.ENCERRADO:
            case AuctionStatus.FINALIZADO:
                lotStatus = LotStatus.VENDIDO;
                break;
            case AuctionStatus.CANCELADO:
                lotStatus = LotStatus.CANCELADO;
                break;
            default:
                lotStatus = LotStatus.EM_BREVE;
        }

        const lot = await prisma.lot.create({
            data: {
                auctionId: auction.id,
                number: `${i + 1}`,
                title: asset.title,
                description: asset.description,
                initialPrice: asset.evaluationValue,
                status: lotStatus,
                imageUrl: assetMedia.url,
                imageMediaId: assetMedia.id,
                galleryImageUrls: [assetMedia.url],
                mediaItemIds: [assetMedia.id],
                tenantId: auction.tenantId,
                categoryId: asset.categoryId,
                subcategoryId: asset.subcategoryId,
                sellerId: asset.sellerId || auction.sellerId,
                auctioneerId: auction.auctioneerId,
                cityId: randomCity.id,
                stateId: randomCity.stateId,
                cityName: randomCity.name,
                stateUf: randomCity.stateId,
                evaluationValue: asset.evaluationValue,
                auctionName: auction.title,
            },
        });

        await prisma.assetsOnLots.create({
            data: {
                lotId: lot.id,
                assetId: asset.id,
                assignedBy: 'seed-script',
            }
        });

        await prisma.asset.update({
            where: { id: asset.id },
            data: { status: AssetStatus.LOTEADO },
        });

        const lotWithAsset = await prisma.lot.findUnique({ where: { id: lot.id }, include: { assets: true } });
        createdLots.push(lotWithAsset);
    }
    return createdLots;
}

async function createAuctionStages(auctions: any[]) {
  const createdStages = [];
  for (const auction of auctions) {
    for (let i = 0; i < 2; i++) {
      const startDate = faker.date.soon();
      const endDate = faker.date.future({ refDate: startDate });
      const stage = await prisma.auctionStage.create({
        data: {
          name: `Etapa ${i + 1}`,
          startDate: startDate,
          endDate: endDate,
          auctionId: auction.id,
          initialPrice: faker.number.float({ min: 100, max: 10000, precision: 2 }),
        },
      });
      createdStages.push(stage);
    }
  }
  console.log(`Created ${createdStages.length} auction stages.`);
  return createdStages;
}

async function createBidsForLots(lots: any[], bidders: any[], bidCount: number) {
    for (const lot of lots) {
        if (lot.status === LotStatus.ABERTO || lot.status === LotStatus.VENDIDO) {
            let lastBidAmount = lot.initialPrice;
            for (let i = 0; i < bidCount; i++) {
                const bidder = faker.helpers.arrayElement(bidders);
                lastBidAmount += faker.number.int({ min: 100, max: 1000 });
                await prisma.bid.create({
                    data: {
                        lotId: lot.id,
                        auctionId: lot.auctionId,
                        bidderId: bidder.id,
                        amount: lastBidAmount,
                        tenantId: lot.tenantId,
                    }
                });
            }
        }
    }
    console.log(`Created bids for ${lots.length} lots.`);
}

async function createUserWins(bidders: any[], lots: any[]) {
  const userWins = [];
  console.log('Creating user wins...');
  const lotsToWin = lots.filter(l => l.status === LotStatus.VENDIDO);

  for (const lot of lotsToWin) {
    const bidder = faker.helpers.arrayElement(bidders);
    const highestBid = await prisma.bid.findFirst({
        where: { lotId: lot.id },
        orderBy: { amount: 'desc' }
    });

    if (highestBid) {
        const userWin = await prisma.userWin.upsert({
          where: { lotId: lot.id },
          update: { userId: highestBid.bidderId, winningBidAmount: highestBid.amount },
          create: {
            userId: highestBid.bidderId,
            lotId: lot.id,
            winningBidAmount: highestBid.amount,
            winDate: new Date(),
            paymentStatus: 'PENDENTE',
          },
        });
        userWins.push(userWin);
    }
  }
  console.log(`Created ${userWins.length} user wins.`);
  return userWins;
}

async function createInstallmentPayments(userWins: any[], installmentsPerWin: number) {
  console.log('Creating installment payments...');
  const createdInstallments = [];
  for (const userWin of userWins) {
    const amount = userWin.winningBidAmount / installmentsPerWin;
    for (let i = 0; i < installmentsPerWin; i++) {
      const installment = await prisma.installmentPayment.create({
        data: {
          amount: amount,
          dueDate: faker.date.future({ years: 1 }),
          status: 'PENDENTE',
          userWinId: userWin.id,
          installmentNumber: i + 1,
        },
      });
      createdInstallments.push(installment);
    }
  }
  console.log(`Created ${createdInstallments.length} installment payments.`);
  return createdInstallments;
}

async function createStatesAndCities() {
  const statesData = [
    { uf: 'AC', name: 'Acre', capital: 'Rio Branco', zip: '69900-000' },
    { uf: 'AL', name: 'Alagoas', capital: 'Maceió', zip: '57000-000' },
    { uf: 'AP', name: 'Amapá', capital: 'Macapá', zip: '68900-000' },
    { uf: 'AM', name: 'Amazonas', capital: 'Manaus', zip: '69000-000' },
    { uf: 'BA', name: 'Bahia', capital: 'Salvador', zip: '40000-000' },
    { uf: 'CE', name: 'Ceará', capital: 'Fortaleza', zip: '60000-000' },
    { uf: 'DF', name: 'Distrito Federal', capital: 'Brasília', zip: '70000-000' },
    { uf: 'ES', name: 'Espírito Santo', capital: 'Vitória', zip: '29000-000' },
    { uf: 'GO', name: 'Goiás', capital: 'Goiânia', zip: '74000-000' },
    { uf: 'MA', name: 'Maranhão', capital: 'São Luís', zip: '65000-000' },
    { uf: 'MT', name: 'Mato Grosso', capital: 'Cuiabá', zip: '78000-000' },
    { uf: 'MS', name: 'Mato Grosso do Sul', capital: 'Campo Grande', zip: '79000-000' },
    { uf: 'MG', name: 'Minas Gerais', capital: 'Belo Horizonte', zip: '30000-000' },
    { uf: 'PA', name: 'Pará', capital: 'Belém', zip: '66000-000' },
    { uf: 'PB', name: 'Paraíba', capital: 'João Pessoa', zip: '58000-000' },
    { uf: 'PR', name: 'Paraná', capital: 'Curitiba', zip: '80000-000' },
    { uf: 'PE', name: 'Pernambuco', capital: 'Recife', zip: '50000-000' },
    { uf: 'PI', name: 'Piauí', capital: 'Teresina', zip: '64000-000' },
    { uf: 'RJ', name: 'Rio de Janeiro', capital: 'Rio de Janeiro', zip: '20000-000' },
    { uf: 'RN', name: 'Rio Grande do Norte', capital: 'Natal', zip: '59000-000' },
    { uf: 'RS', name: 'Rio Grande do Sul', capital: 'Porto Alegre', zip: '90000-000' },
    { uf: 'RO', name: 'Rondônia', capital: 'Porto Velho', zip: '76800-000' },
    { uf: 'RR', name: 'Roraima', capital: 'Boa Vista', zip: '69300-000' },
    { uf: 'SC', name: 'Santa Catarina', capital: 'Florianópolis', zip: '88000-000' },
    { uf: 'SP', name: 'São Paulo', capital: 'São Paulo', zip: '01000-000' },
    { uf: 'SE', name: 'Sergipe', capital: 'Aracaju', zip: '49000-000' },
    { uf: 'TO', name: 'Tocantins', capital: 'Palmas', zip: '77000-000' },
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
      update: { zipCode: stateData.zip },
      create: { name: stateData.capital, stateId: state.id, slug: stateData.capital.toLowerCase(), zipCode: stateData.zip },
    });
    cities.push(capitalCity);
  }

  console.log('Created/found states and capital cities.');
  return { states, cities };
}

async function createCategoriesAndSubcategories() {
  const categoriesData = [
    { name: 'Imóveis', slug: 'imoveis', sub: ['Apartamentos', 'Casas', 'Terrenos'] },
    { name: 'Veículos', slug: 'veiculos', sub: ['Carros', 'Motos', 'Caminhões'] },
    { name: 'Semoventes', slug: 'semoventes', sub: ['Bovinos', 'Equinos'] },
  ];
  const categories = [];
  const subcategories = [];

  for (const catData of categoriesData) {
    const category = await prisma.lotCategory.upsert({
      where: { slug: catData.slug },
      update: {}, 
      create: { name: catData.name, slug: catData.slug, hasSubcategories: true },
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

async function createCourts(states: any[], count: number) {
  const courts = [];
  for (let i = 0; i < count; i++) {
    const state = faker.helpers.arrayElement(states);
    const slug = `tj-${state.uf.toLowerCase()}-${i}`;
    const court = await prisma.court.upsert({
      where: { slug },
      update: {}, 
      create: {
        name: `Tribunal de Justiça de ${state.name} #${i+1}`,
        slug: slug,
        stateUf: state.uf,
      },
    });
    courts.push(court);
  }
  console.log(`Created ${courts.length} courts.`);
  return courts;
}

async function createJudicialDistricts(courts: any[], cities: any[], count: number) {
    const districts = [];
    for (let i = 0; i < count; i++) {
        const city = faker.helpers.arrayElement(cities);
        const court = faker.helpers.arrayElement(courts);
        const name = `Comarca de ${city.name} #${i+1}`;
        const district = await prisma.judicialDistrict.upsert({
            where: { name },
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
    console.log(`Created ${districts.length} judicial districts.`);
    return districts;
}

async function createJudicialBranches(districts: any[], count: number) {
    const branches = [];
    for (let i = 0; i < count; i++) {
        const district = faker.helpers.arrayElement(districts);
        const name = `${i + 1}ª Vara Cível de ${district.name}`;
        const branch = await prisma.judicialBranch.create({
            data: {
                name: name,
                slug: faker.helpers.slugify(name).toLowerCase(),
                districtId: district.id,
            },
        });
        branches.push(branch);
    }
    console.log(`Created ${branches.length} judicial branches.`);
    return branches;
}

async function createJudicialProcesses(tenantId: string, courts: any[], branches: any[], sellers: any[], count: number) {
  const judicialProcesses = [];
  for (let i = 0; i < count; i++) {
    const branch = faker.helpers.arrayElement(branches);
    const judicialProcess = await prisma.judicialProcess.create({
      data: {
        publicId: faker.string.uuid(),
        processNumber: faker.string.numeric(20),
        tenantId: tenantId,
        courtId: faker.helpers.arrayElement(courts).id,
        branchId: branch.id,
        districtId: branch.districtId,
        sellerId: faker.helpers.arrayElement(sellers).id,
      },
    });
    judicialProcesses.push(judicialProcess);
  }
  console.log(`Created ${judicialProcesses.length} judicial processes.`);
  return judicialProcesses;
}

async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // Handle redirect
        https.get(res.headers.location!, (res) => {
          const writeStream = fs.createWriteStream(filepath);
          res.pipe(writeStream);
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        }).on('error', reject);
      } else {
        const writeStream = fs.createWriteStream(filepath);
        res.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      }
    }).on('error', reject);
  });
}

async function createMediaItems(count: number, tenantId: string) {
    console.log(`Downloading ${count} images from Unsplash...`);
    const mediaItems = [];
    for (let i = 0; i < count; i++) {
        const imageName = `image_${Date.now()}.jpg`;
        const imagePath = path.join(UPLOADS_DIR, imageName);
        const imageUrl = 'https://source.unsplash.com/random/800x600';

        try {
            await downloadImage(imageUrl, imagePath);
            const mediaItem = await prisma.mediaItem.create({
                data: {
                    fileName: imageName,
                    fileType: 'image/jpeg',
                    size: fs.statSync(imagePath).size,
                    url: `/uploads/${imageName}`,
                    tenantId: tenantId,
                }
            });
            mediaItems.push(mediaItem);
            console.log(`Downloaded and created media item ${i + 1}/${count}`);
        } catch (error) {
            console.error(`Failed to download or create media item:`, error);
        }
    }
    return mediaItems;
}


// =================================================================
// EXECUTION
// =================================================================

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
