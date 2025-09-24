// scripts/seed-data-extended.ts
import { PrismaClient, Prisma, AuctionType, AssetStatus, LotStatus, AuctionStatus, AuctionMethod, Participation } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// =================================================================
// SEED CONFIGURATION
// =================================================================
const seedConfig = {
  users: {
    bidders: 5, // Aumentado para mais licitantes
  },
  sellers: 5, // Aumentado para mais vendedores
  auctioneers: 3, // Aumentado para mais leiloeiros
  judicial: {
    courts: 3,
    districts: 5,
    branches: 5,
    processes: 5,
  },
  assets: {
    totalPerCategory: 5, // Aumentado para mais ativos por categoria
    judicialRatio: 0.4,
  },
  auctions: {
    judicial: 2, // Aumentado para mais leilões judiciais
    extrajudicial: 2, // Aumentado para mais leilões extrajudiciais
    particular: 2, // Aumentado para mais leilões particulares
    tomadaDePrecos: 1, // Nova categoria de leilão
    vendaDireta: 1, // Nova categoria de leilão
    lotsPerAuction: 3, // Aumentado para mais lotes por leilão
  },
  installmentPayments: {
    perUserWin: 2, // Número de parcelas por arremate
  }
};


// =================================================================
// SEEDING SCRIPT
// =================================================================

async function main() {
  console.log('Starting extended seeding with controlled scenarios...');

  // --- 1. FETCH PRESERVED DATA ---
  console.log('Fetching preserved data (Tenant, Admin User, Roles)...
');
  const tenant = await prisma.tenant.findUnique({ where: { id: '1' } });
  if (!tenant) {
    console.error('Tenant with ID 1 not found. Please ensure it exists.');
    return;
  }
  console.log(`Using tenant: ${tenant.name}`);

  const createdRoles = await createRoles();
  const adminRole = createdRoles.find(r => r.nameNormalized === 'ADMIN');
  if (!adminRole) {
      console.error('ADMIN role not found after creation. This should not happen.');
      return;
  }
  const userRole = createdRoles.find(r => r.nameNormalized === 'USER');
  if (!userRole) {
      console.error('USER role not found after creation. This should not happen.');
      return;
  }

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@bidexpert.com.br' } });
  if (!adminUser) {
    console.error('Admin user admin@bidexpert.com.br not found. Please ensure it exists.');
    return;
  }
  console.log(`Using admin user: ${adminUser.email}`);

  await prisma.usersOnRoles.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id, assignedBy: 'seed-script' },
  });
  console.log(`Ensured admin user ${adminUser.email} has ADMIN role.
`);

  // --- 2. CREATE NEW DATA ---
  console.log('Creating new data based on configuration...
');

  const bidders = await createBidders(tenant.id, userRole.id, seedConfig.users.bidders);
  const { states, cities } = await createStatesAndCities();
  const capitalCities = cities.filter(city => states.some(state => state.capital === city.name));
  const { categories, subcategories } = await createCategoriesAndSubcategories();
  const sellers = await createSellers(tenant.id, seedConfig.sellers);
  const auctioneers = await createAuctioneers(tenant.id, seedConfig.auctioneers);
  
  // Judicial Entities
  const courts = await createCourts(states, seedConfig.judicial.courts);
  const districts = await createJudicialDistricts(courts, cities, seedConfig.judicial.districts);
  const branches = await createJudicialBranches(districts, seedConfig.judicial.branches);
  const judicialProcesses = await createJudicialProcesses(tenant.id, courts, branches, sellers, seedConfig.judicial.processes);

  // --- 3. CREATE ASSETS (NEW LOGIC) ---
  console.log('
Creating assets with varied scenarios...');
  const createdAssets = await createAssets(tenant.id, categories, subcategories, judicialProcesses, sellers, cities);
  console.log(`Created ${createdAssets.length} assets.`);

  console.log('
Creating assets for all statuses...');
  const assetsForAllStatuses = await createAssetsForAllStatuses(tenant.id, categories, subcategories, judicialProcesses, sellers, cities);
  console.log(`Created ${assetsForAllStatuses.length} assets for all statuses.`);

  let availableAssets = [...createdAssets, ...assetsForAllStatuses];

  // --- 4. CREATE AUCTIONS AND LOTS (NEW LOGIC) ---
  console.log('
Creating auctions and lots...');

  const auctionTypesToCreate = [
      ...Array(seedConfig.auctions.judicial).fill(AuctionType.JUDICIAL),
      ...Array(seedConfig.auctions.extrajudicial).fill(AuctionType.EXTRAJUDICIAL),
      ...Array(seedConfig.auctions.particular).fill(AuctionType.PARTICULAR),
      ...Array(seedConfig.auctions.tomadaDePrecos).fill(AuctionType.TOMADA_DE_PRECOS),
      ...Array(seedConfig.auctions.vendaDireta).fill(AuctionType.VENDA_DIRETA),
  ];

  let allCreatedAuctions: any[] = [];

  for (const type of auctionTypesToCreate) {
    const isJudicial = type === AuctionType.JUDICIAL;
    const suitableAssets = availableAssets.filter(a => (isJudicial ? !!a.judicialProcessId : !a.judicialProcessId) && a.status === AssetStatus.DISPONIVEL);

    if (suitableAssets.length < seedConfig.auctions.lotsPerAuction) {
        console.warn(`Not enough available ${type} assets to create a full auction. Skipping.`);
        continue;
    }

    const auction = await createAuction(tenant.id, auctioneers, sellers, cities, type, `Leilão ${type} de Teste`, courts, districts, branches);
    allCreatedAuctions.push(auction);
    const lots = await createLotsForAuction(auction, suitableAssets, seedConfig.auctions.lotsPerAuction, cities);
    
    const lottedAssetIds = lots.flatMap(l => l.assets.map(a => a.assetId));
    availableAssets = availableAssets.filter(a => !lottedAssetIds.includes(a.id));

    console.log(`Created ${type} auction "${auction.title}" with ${lots.length} lots.`);
  }

  console.log('
Creating auctions for all statuses...');
  const auctionsForAllStatuses = await createAuctionsForAllStatuses(tenant.id, auctioneers, sellers, cities, courts, districts, branches);
  allCreatedAuctions.push(...auctionsForAllStatuses);
  
  for (const auction of auctionsForAllStatuses) {
      console.log(`Creating lots for auction with status ${auction.status}...`);
      const freshStatusAssets = await createAssets(tenant.id, categories, subcategories, judicialProcesses, sellers, cities);
      let freshAvailableStatusAssets = [...freshStatusAssets];

      const lotsForStatusAuction = await createLotsForAllStatuses(auction, freshAvailableStatusAssets, cities);
      const lottedAssetIds = lotsForStatusAuction.flatMap(l => l.assets.map(a => a.assetId));
      freshAvailableStatusAssets = freshAvailableStatusAssets.filter(a => !lottedAssetIds.includes(a.id));
  }

  console.log('
Creating auctions and lots for capital cities...');
  const { createdAuctions: capitalAuctions, createdLots: capitalLots } = await createCapitalCityAuctionsAndLots(tenant.id, auctioneers, sellers, cities, capitalCities, availableAssets, courts, districts, branches);
  allCreatedAuctions.push(...capitalAuctions);
  const lottedAssetIdsCapital = capitalLots.flatMap(l => l.assets.map(a => a.assetId));
  availableAssets = availableAssets.filter(a => !lottedAssetIdsCapital.includes(a.id));

  console.log('
Creating auction stages for all auctions...');
  await createAuctionStages(allCreatedAuctions);

  console.log('
Creating user wins and installment payments...');
  const userWins = await createUserWins(bidders, allCreatedAuctions);
  await createInstallmentPayments(userWins, seedConfig.installmentPayments.perUserWin);

  console.log('
Seeding finished successfully!');
  await createUseCasesDocumentation(); // Generate documentation
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
    console.log(`Created/found role: ${role.name}`);
  }
  return createdRoles;
}

function generateImageUrls(count: number = 3) {
  const imageUrl = faker.image.urlLoremFlickr({ category: 'nature', width: 640, height: 480 });
  const imageMediaId = faker.string.uuid();
  const galleryImageUrls = Array.from({ length: count }, () => faker.image.urlLoremFlickr({ category: 'nature', width: 640, height: 480 }));
  const mediaItemIds = Array.from({ length: count }, () => faker.string.uuid());
  return { imageUrl, imageMediaId, galleryImageUrls, mediaItemIds };
}

async function createBidders(tenantId: string, userRoleId: string, count: number) {
    const bidders = [];
    for (let i = 0; i < count; i++) {
        const bidderEmail = `bidder${i}@example.com`;
        const bidder = await prisma.user.upsert({
            where: { email: bidderEmail },
            update: {},
            create: {
                email: bidderEmail,
                fullName: faker.person.fullName(),
                password: 'password',
                habilitationStatus: 'HABILITADO',
                cpf: faker.string.numeric(11),
                cellPhone: faker.phone.number('## #####-####'),
                zipCode: faker.location.zipCode(),
                street: faker.location.street(),
                number: faker.location.buildingNumber(),
                complement: faker.location.secondaryAddress(),
                neighborhood: faker.location.county(),
                city: faker.location.city(),
                state: faker.location.stateAbbr(),
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

async function createSellers(tenantId: string, count: number) {
  const sellers = [];
  for (let i = 0; i < count; i++) {
    const name = faker.company.name();
    const slug = faker.helpers.slugify(name).toLowerCase();
    const isJudicial = faker.datatype.boolean(); // Randomly assign judicial status
    const seller = await prisma.seller.create({
      data: {
        publicId: faker.string.uuid(),
        slug: `${slug}-${i}`,
        name: name,
        email: faker.internet.email(),
        tenantId: tenantId,
        isJudicial: isJudicial,
        // judicialBranchId will be linked later if isJudicial is true
        phone: faker.phone.number('## #####-####'),
        address: faker.location.streetAddress(true),
        city: faker.location.city(),
        state: faker.location.stateAbbr(),
        zipCode: faker.location.zipCode(),
      },
    });
    sellers.push(seller);
  }
  console.log(`Created ${sellers.length} sellers.`);
  return sellers;
}

async function createAuctioneers(tenantId: string, count: number) {
  const auctioneers = [];
  for (let i = 0; i < count; i++) {
    const name = faker.person.fullName();
    const slug = faker.helpers.slugify(name).toLowerCase();
    const auctioneer = await prisma.auctioneer.create({
      data: {
        publicId: faker.string.uuid(),
        slug: `${slug}-${i}`,
        name: name,
        email: faker.internet.email(),
        tenantId: tenantId,
        phone: faker.phone.number('## #####-####'),
        address: faker.location.streetAddress(true),
        city: faker.location.city(),
        state: faker.location.stateAbbr(),
        zipCode: faker.location.zipCode(),
      },
    });
    auctioneers.push(auctioneer);
  }
  console.log(`Created ${auctioneers.length} auctioneers.`);
  return auctioneers;
}

async function createAssets(tenantId: string, categories: any[], subcategories: any[], judicialProcesses: any[], sellers: any[], cities: any[]) {
  const assets = [];
  const categoryMap = new Map(categories.map(c => [c.slug, c]));

  const assetCreators = {
    VEICULO: (category, subcategory) => ({
      title: `Veículo ${faker.vehicle.manufacturer()} ${faker.vehicle.model()}`,
      description: faker.vehicle.type(),
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
      runningCondition: faker.helpers.arrayElement(['Ótimo', 'Bom', 'Regular', 'Ruim']),
      bodyCondition: faker.helpers.arrayElement(['Perfeita', 'Pequenos Amassados', 'Amassado', 'Danificado']),
      tiresCondition: faker.helpers.arrayElement(['Novos', 'Bons', 'Meia Vida', 'Gastos']),
      hasKey: faker.datatype.boolean(),
    }),
    IMOVEL: (category, subcategory) => ({
      title: `Imóvel em ${faker.location.city()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      propertyRegistrationNumber: faker.string.numeric(10),
      iptuNumber: faker.string.numeric(10),
      isOccupied: faker.datatype.boolean(),
      totalArea: faker.number.float({ min: 50, max: 500, precision: 0.01 }),
      builtArea: faker.number.float({ min: 30, max: 300, precision: 0.01 }),
      bedrooms: faker.number.int({ min: 1, max: 5 }),
      suites: faker.number.int({ min: 0, max: 3 }),
      bathrooms: faker.number.int({ min: 1, max: 4 }),
      parkingSpaces: faker.number.int({ min: 0, max: 4 }),
      constructionType: faker.helpers.arrayElement(['Alvenaria', 'Madeira', 'Mista']),
      hasHabiteSe: faker.datatype.boolean(),
      zoningRestrictions: faker.helpers.arrayElement(['Residencial', 'Comercial', 'Mista']),
      amenities: JSON.stringify(faker.helpers.arrayElements(['Piscina', 'Churrasqueira', 'Academia', 'Salão de Festas'], faker.number.int({ min: 0, max: 4 }))),
    }),
    ELETRONICO: (category, subcategory) => ({
      title: `Eletrônico ${faker.commerce.productName()}`,
      description: faker.commerce.productDescription(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      brand: faker.company.name(),
      serialNumber: faker.string.uuid(),
      itemCondition: faker.helpers.arrayElement(['Novo', 'Usado', 'Recondicionado']),
      hasInvoice: faker.datatype.boolean(),
      hasWarranty: faker.datatype.boolean(),
    }),
    ELETRODOMESTICO: (category, subcategory) => ({
      title: `Eletrodoméstico ${faker.commerce.productName()}`,
      description: faker.commerce.productDescription(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      brand: faker.company.name(),
      serialNumber: faker.string.uuid(),
      itemCondition: faker.helpers.arrayElement(['Novo', 'Usado', 'Recondicionado']),
      applianceCapacity: `${faker.number.int({ min: 100, max: 500 })}L`,
      voltage: faker.helpers.arrayElement(['110V', '220V', 'Bivolt']),
      applianceType: faker.helpers.arrayElement(['Geladeira', 'Fogão', 'Máquina de Lavar', 'Microondas']),
      hasInvoice: faker.datatype.boolean(),
      hasWarranty: faker.datatype.boolean(),
    }),
    SEMOVENTE: (category, subcategory) => ({
      title: `Semovente ${faker.animal.type()} ${faker.person.firstName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      breed: faker.animal.breed(),
      age: `${faker.number.int({ min: 1, max: 10 })} anos`,
      sex: faker.helpers.arrayElement(['Macho', 'Fêmea']),
      weight: `${faker.number.int({ min: 50, max: 1000 })} kg`,
      individualId: faker.string.numeric(10),
      purpose: faker.helpers.arrayElement(['Corte', 'Leite', 'Reprodução', 'Trabalho']),
      isPregnant: faker.datatype.boolean(),
    }),
    IMPLEMENTO: (category, subcategory) => ({
      title: `Implemento Agrícola ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      brand: faker.company.name(),
      serialNumber: faker.string.uuid(),
      hoursUsed: faker.number.int({ min: 100, max: 5000 }),
      engineType: faker.helpers.arrayElement(['Diesel', 'Gasolina']),
      capacityOrPower: `${faker.number.int({ min: 50, max: 300 })} HP`,
      compliesWithNR: faker.datatype.boolean() ? 'Sim' : 'Não',
    }),
    EQUIPAMENTO_INDUSTRIAL: (category, subcategory) => ({
      title: `Equipamento Industrial ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      brand: faker.company.name(),
      serialNumber: faker.string.uuid(),
      hoursUsed: faker.number.int({ min: 1000, max: 10000 }),
      engineType: faker.helpers.arrayElement(['Elétrico', 'Hidráulico', 'Pneumático']),
      capacityOrPower: `${faker.number.int({ min: 10, max: 500 })} kW`,
      compliesWithNR: faker.datatype.boolean() ? 'Sim' : 'Não',
      installationLocation: faker.helpers.arrayElement(['Fábrica', 'Armazém', 'Canteiro de Obras']),
    }),
    TECNOLOGIA: (category, subcategory) => ({
      title: `Tecnologia ${faker.commerce.productName()}`,
      description: faker.commerce.productDescription(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      brand: faker.company.name(),
      serialNumber: faker.string.uuid(),
      itemCondition: faker.helpers.arrayElement(['Novo', 'Usado', 'Recondicionado']),
      specifications: faker.lorem.sentence(),
      hasInvoice: faker.datatype.boolean(),
      hasWarranty: faker.datatype.boolean(),
    }),
    MOVEIS: (category, subcategory) => ({
      title: `Móvel ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      furnitureType: faker.helpers.arrayElement(['Cadeira', 'Mesa', 'Sofá', 'Armário']),
      material: faker.helpers.arrayElement(['Madeira', 'Metal', 'Plástico', 'Tecido']),
      style: faker.helpers.arrayElement(['Moderno', 'Clássico', 'Rústico']),
      dimensions: `${faker.number.int({ min: 50, max: 200 })}x${faker.number.int({ min: 50, max: 200 })}x${faker.number.int({ min: 50, max: 200 })}cm`,
      pieceCount: faker.number.int({ min: 1, max: 5 }),
    }),
    JOIAS: (category, subcategory) => ({
      title: `Joia ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      jewelryType: faker.helpers.arrayElement(['Anel', 'Colar', 'Brinco', 'Pulseira']),
      metal: faker.helpers.arrayElement(['Ouro', 'Prata', 'Platina']),
      gemstones: faker.helpers.arrayElement(['Diamante', 'Esmeralda', 'Rubi', 'Safira', 'Nenhuma']),
      totalWeight: `${faker.number.float({ min: 1, max: 50, precision: 0.1 })}g`,
      jewelrySize: faker.helpers.arrayElement(['Pequeno', 'Médio', 'Grande']),
      authenticityCertificate: faker.datatype.boolean() ? faker.string.uuid() : undefined,
    }),
    ARTE: (category, subcategory) => ({
      title: `Obra de Arte ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      workType: faker.helpers.arrayElement(['Pintura', 'Escultura', 'Gravura', 'Fotografia']),
      artist: faker.person.fullName(),
      period: faker.helpers.arrayElement(['Contemporânea', 'Moderna', 'Clássica']),
      technique: faker.helpers.arrayElement(['Óleo sobre tela', 'Acrílica', 'Bronze', 'Mármore']),
      provenance: faker.lorem.sentence(),
    }),
    NAUTICA: (category, subcategory) => ({
      title: `Embarcação ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      boatType: faker.helpers.arrayElement(['Lancha', 'Veleiro', 'Jet Ski', 'Caiaque']),
      boatLength: `${faker.number.float({ min: 2, max: 20, precision: 0.1 })}m`,
      hullMaterial: faker.helpers.arrayElement(['Fibra de Vidro', 'Alumínio', 'Madeira']),
      onboardEquipment: faker.lorem.sentence(),
    }),
    ALIMENTOS: (category, subcategory) => ({
      title: `Alimento ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      productName: faker.commerce.productName(),
      quantity: `${faker.number.int({ min: 1, max: 100 })}kg`,
      packagingType: faker.helpers.arrayElement(['Saco', 'Caixa', 'Granel']),
      expirationDate: faker.date.future(),
      storageConditions: faker.helpers.arrayElement(['Ambiente', 'Refrigerado', 'Congelado']),
    }),
    METAIS_PRECIOSOS: (category, subcategory) => ({
      title: `Metal Precioso ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      preciousMetalType: faker.helpers.arrayElement(['Ouro', 'Prata', 'Platina', 'Paládio']),
      purity: faker.helpers.arrayElement(['24K', '18K', '925', '950']),
      totalWeight: `${faker.number.float({ min: 1, max: 1000, precision: 0.1 })}g`,
    }),
    PRODUTOS_FLORESTAIS: (category, subcategory) => ({
      title: `Produto Florestal ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      forestGoodsType: faker.helpers.arrayElement(['Madeira em Tora', 'Celulose', 'Carvão', 'Resina']),
      volumeOrQuantity: `${faker.number.int({ min: 1, max: 500 })}m³`,
      species: faker.animal.type(),
      dofNumber: faker.string.numeric(10),
    }),
  };

  const assetTypes = Object.keys(assetCreators);
  const totalAssetsToCreate = seedConfig.assets.totalPerCategory * assetTypes.length;
  const numJudicial = Math.floor(totalAssetsToCreate * seedConfig.assets.judicialRatio);

  for (let i = 0; i < totalAssetsToCreate; i++) {
    const assetTypeSlug = faker.helpers.arrayElement(assetTypes);
    const category = categoryMap.get(assetTypeSlug.toLowerCase());
    const subcategory = faker.helpers.arrayElement(subcategories.filter(s => s.parentCategoryId === category.id));

    const assetData = assetCreators[assetTypeSlug](category, subcategory);

    const isJudicial = assets.filter(a => a.judicialProcessId).length < numJudicial;

    const { categoryId, subcategoryId, ...restAssetData } = assetData;
    const imageInfo = generateImageUrls(3); // Always generate 3 gallery images
    const randomCity = faker.helpers.arrayElement(cities);

    const finalAssetData: Prisma.AssetCreateInput = {
        ...restAssetData,
        publicId: faker.string.uuid(),
        evaluationValue: faker.number.float({ min: 1000, max: 150000, precision: 0.01 }),
        status: AssetStatus.DISPONIVEL,
        tenant: { connect: { id: tenantId } },
        category: categoryId ? { connect: { id: categoryId } } : undefined,
        subcategory: subcategoryId ? { connect: { id: subcategoryId } } : undefined,
        judicialProcess: isJudicial && judicialProcesses.length > 0 ? { connect: { id: faker.helpers.arrayElement(judicialProcesses).id } } : undefined,
        seller: !isJudicial && sellers.length > 0 ? { connect: { id: faker.helpers.arrayElement(sellers).id } } : undefined,
        imageUrl: imageInfo.imageUrl,
        imageMediaId: imageInfo.imageMediaId,
        galleryImageUrls: imageInfo.galleryImageUrls as Prisma.JsonArray,
        mediaItemIds: imageInfo.mediaItemIds as Prisma.JsonArray,
        locationCity: randomCity.name,
        locationState: randomCity.stateId, // Assuming stateId is UF
        address: faker.location.streetAddress(true),
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
    };

    const asset = await prisma.asset.create({ data: finalAssetData });
    assets.push(asset);
  }

  return assets;
}

async function createAssetsForAllStatuses(tenantId: string, categories: any[], subcategories: any[], judicialProcesses: any[], sellers: any[], cities: any[]) {
  const assets = [];
  const assetStatuses = Object.values(AssetStatus);
  const categoryMap = new Map(categories.map(c => [c.slug, c]));

  const assetCreators = {
    VEICULO: (category, subcategory) => ({
      title: `Veículo ${faker.vehicle.manufacturer()} ${faker.vehicle.model()}`,
      description: faker.vehicle.type(),
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
      runningCondition: faker.helpers.arrayElement(['Ótimo', 'Bom', 'Regular', 'Ruim']),
      bodyCondition: faker.helpers.arrayElement(['Perfeita', 'Pequenos Amassados', 'Amassado', 'Danificado']),
      tiresCondition: faker.helpers.arrayElement(['Novos', 'Bons', 'Meia Vida', 'Gastos']),
      hasKey: faker.datatype.boolean(),
    }),
    IMOVEL: (category, subcategory) => ({
      title: `Imóvel em ${faker.location.city()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      propertyRegistrationNumber: faker.string.numeric(10),
      iptuNumber: faker.string.numeric(10),
      isOccupied: faker.datatype.boolean(),
      totalArea: faker.number.float({ min: 50, max: 500, precision: 0.01 }),
      builtArea: faker.number.float({ min: 30, max: 300, precision: 0.01 }),
      bedrooms: faker.number.int({ min: 1, max: 5 }),
      suites: faker.number.int({ min: 0, max: 3 }),
      bathrooms: faker.number.int({ min: 1, max: 4 }),
      parkingSpaces: faker.number.int({ min: 0, max: 4 }),
      constructionType: faker.helpers.arrayElement(['Alvenaria', 'Madeira', 'Mista']),
      hasHabiteSe: faker.datatype.boolean(),
      zoningRestrictions: faker.helpers.arrayElement(['Residencial', 'Comercial', 'Mista']),
      amenities: JSON.stringify(faker.helpers.arrayElements(['Piscina', 'Churrasqueira', 'Academia', 'Salão de Festas'], faker.number.int({ min: 0, max: 4 }))),
    }),
    ELETRONICO: (category, subcategory) => ({
      title: `Eletrônico ${faker.commerce.productName()}`,
      description: faker.commerce.productDescription(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      brand: faker.company.name(),
      serialNumber: faker.string.uuid(),
      itemCondition: faker.helpers.arrayElement(['Novo', 'Usado', 'Recondicionado']),
      hasInvoice: faker.datatype.boolean(),
      hasWarranty: faker.datatype.boolean(),
    }),
    ELETRODOMESTICO: (category, subcategory) => ({
      title: `Eletrodoméstico ${faker.commerce.productName()}`,
      description: faker.commerce.productDescription(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      brand: faker.company.name(),
      serialNumber: faker.string.uuid(),
      itemCondition: faker.helpers.arrayElement(['Novo', 'Usado', 'Recondicionado']),
      applianceCapacity: `${faker.number.int({ min: 100, max: 500 })}L`,
      voltage: faker.helpers.arrayElement(['110V', '220V', 'Bivolt']),
      applianceType: faker.helpers.arrayElement(['Geladeira', 'Fogão', 'Máquina de Lavar', 'Microondas']),
      hasInvoice: faker.datatype.boolean(),
      hasWarranty: faker.datatype.boolean(),
    }),
    SEMOVENTE: (category, subcategory) => ({
      title: `Semovente ${faker.animal.type()} ${faker.person.firstName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      breed: faker.animal.breed(),
      age: `${faker.number.int({ min: 1, max: 10 })} anos`,
      sex: faker.helpers.arrayElement(['Macho', 'Fêmea']),
      weight: `${faker.number.int({ min: 50, max: 1000 })} kg`,
      individualId: faker.string.numeric(10),
      purpose: faker.helpers.arrayElement(['Corte', 'Leite', 'Reprodução', 'Trabalho']),
      isPregnant: faker.datatype.boolean(),
    }),
    IMPLEMENTO: (category, subcategory) => ({
      title: `Implemento Agrícola ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      brand: faker.company.name(),
      serialNumber: faker.string.uuid(),
      hoursUsed: faker.number.int({ min: 100, max: 5000 }),
      engineType: faker.helpers.arrayElement(['Diesel', 'Gasolina']),
      capacityOrPower: `${faker.number.int({ min: 50, max: 300 })} HP`,
      compliesWithNR: faker.datatype.boolean() ? 'Sim' : 'Não',
    }),
    EQUIPAMENTO_INDUSTRIAL: (category, subcategory) => ({
      title: `Equipamento Industrial ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      brand: faker.company.name(),
      serialNumber: faker.string.uuid(),
      hoursUsed: faker.number.int({ min: 1000, max: 10000 }),
      engineType: faker.helpers.arrayElement(['Elétrico', 'Hidráulico', 'Pneumático']),
      capacityOrPower: `${faker.number.int({ min: 10, max: 500 })} kW`,
      compliesWithNR: faker.datatype.boolean() ? 'Sim' : 'Não',
      installationLocation: faker.helpers.arrayElement(['Fábrica', 'Armazém', 'Canteiro de Obras']),
    }),
    TECNOLOGIA: (category, subcategory) => ({
      title: `Tecnologia ${faker.commerce.productName()}`,
      description: faker.commerce.productDescription(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      brand: faker.company.name(),
      serialNumber: faker.string.uuid(),
      itemCondition: faker.helpers.arrayElement(['Novo', 'Usado', 'Recondicionado']),
      specifications: faker.lorem.sentence(),
      hasInvoice: faker.datatype.boolean(),
      hasWarranty: faker.datatype.boolean(),
    }),
    MOVEIS: (category, subcategory) => ({
      title: `Móvel ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      furnitureType: faker.helpers.arrayElement(['Cadeira', 'Mesa', 'Sofá', 'Armário']),
      material: faker.helpers.arrayElement(['Madeira', 'Metal', 'Plástico', 'Tecido']),
      style: faker.helpers.arrayElement(['Moderno', 'Clássico', 'Rústico']),
      dimensions: `${faker.number.int({ min: 50, max: 200 })}x${faker.number.int({ min: 50, max: 200 })}x${faker.number.int({ min: 50, max: 200 })}cm`,
      pieceCount: faker.number.int({ min: 1, max: 5 }),
    }),
    JOIAS: (category, subcategory) => ({
      title: `Joia ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      jewelryType: faker.helpers.arrayElement(['Anel', 'Colar', 'Brinco', 'Pulseira']),
      metal: faker.helpers.arrayElement(['Ouro', 'Prata', 'Platina']),
      gemstones: faker.helpers.arrayElement(['Diamante', 'Esmeralda', 'Rubi', 'Safira', 'Nenhuma']),
      totalWeight: `${faker.number.float({ min: 1, max: 50, precision: 0.1 })}g`,
      jewelrySize: faker.helpers.arrayElement(['Pequeno', 'Médio', 'Grande']),
      authenticityCertificate: faker.datatype.boolean() ? faker.string.uuid() : undefined,
    }),
    ARTE: (category, subcategory) => ({
      title: `Obra de Arte ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      workType: faker.helpers.arrayElement(['Pintura', 'Escultura', 'Gravura', 'Fotografia']),
      artist: faker.person.fullName(),
      period: faker.helpers.arrayElement(['Contemporânea', 'Moderna', 'Clássica']),
      technique: faker.helpers.arrayElement(['Óleo sobre tela', 'Acrílica', 'Bronze', 'Mármore']),
      provenance: faker.lorem.sentence(),
    }),
    NAUTICA: (category, subcategory) => ({
      title: `Embarcação ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      boatType: faker.helpers.arrayElement(['Lancha', 'Veleiro', 'Jet Ski', 'Caiaque']),
      boatLength: `${faker.number.float({ min: 2, max: 20, precision: 0.1 })}m`,
      hullMaterial: faker.helpers.arrayElement(['Fibra de Vidro', 'Alumínio', 'Madeira']),
      onboardEquipment: faker.lorem.sentence(),
    }),
    ALIMENTOS: (category, subcategory) => ({
      title: `Alimento ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      productName: faker.commerce.productName(),
      quantity: `${faker.number.int({ min: 1, max: 100 })}kg`,
      packagingType: faker.helpers.arrayElement(['Saco', 'Caixa', 'Granel']),
      expirationDate: faker.date.future(),
      storageConditions: faker.helpers.arrayElement(['Ambiente', 'Refrigerado', 'Congelado']),
    }),
    METAIS_PRECIOSOS: (category, subcategory) => ({
      title: `Metal Precioso ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      preciousMetalType: faker.helpers.arrayElement(['Ouro', 'Prata', 'Platina', 'Paládio']),
      purity: faker.helpers.arrayElement(['24K', '18K', '925', '950']),
      totalWeight: `${faker.number.float({ min: 1, max: 1000, precision: 0.1 })}g`,
    }),
    PRODUTOS_FLORESTAIS: (category, subcategory) => ({
      title: `Produto Florestal ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      forestGoodsType: faker.helpers.arrayElement(['Madeira em Tora', 'Celulose', 'Carvão', 'Resina']),
      volumeOrQuantity: `${faker.number.int({ min: 1, max: 500 })}m³`,
      species: faker.animal.type(),
      dofNumber: faker.string.numeric(10),
    }),
  };

  const assetTypes = Object.keys(assetCreators);
  const totalAssetsToCreate = seedConfig.assets.totalPerCategory * assetTypes.length;
  const numJudicial = Math.floor(totalAssetsToCreate * seedConfig.assets.judicialRatio);

  for (let i = 0; i < totalAssetsToCreate; i++) {
    const assetTypeSlug = faker.helpers.arrayElement(assetTypes);
    const category = categoryMap.get(assetTypeSlug.toLowerCase());
    const subcategory = faker.helpers.arrayElement(subcategories.filter(s => s.parentCategoryId === category.id));

    const assetData = assetCreators[assetTypeSlug](category, subcategory);

    const isJudicial = assets.filter(a => a.judicialProcessId).length < numJudicial;

    const { categoryId, subcategoryId, ...restAssetData } = assetData;
    const imageInfo = generateImageUrls(3); // Always generate 3 gallery images
    const randomCity = faker.helpers.arrayElement(cities);

    const finalAssetData: Prisma.AssetCreateInput = {
        ...restAssetData,
        publicId: faker.string.uuid(),
        evaluationValue: faker.number.float({ min: 1000, max: 150000, precision: 0.01 }),
        status: AssetStatus.DISPONIVEL,
        tenant: { connect: { id: tenantId } },
        category: categoryId ? { connect: { id: categoryId } } : undefined,
        subcategory: subcategoryId ? { connect: { id: subcategoryId } } : undefined,
        judicialProcess: isJudicial && judicialProcesses.length > 0 ? { connect: { id: faker.helpers.arrayElement(judicialProcesses).id } } : undefined,
        seller: !isJudicial && sellers.length > 0 ? { connect: { id: faker.helpers.arrayElement(sellers).id } } : undefined,
        imageUrl: imageInfo.imageUrl,
        imageMediaId: imageInfo.imageMediaId,
        galleryImageUrls: imageInfo.galleryImageUrls as Prisma.JsonArray,
        mediaItemIds: imageInfo.mediaItemIds as Prisma.JsonArray,
        locationCity: randomCity.name,
        locationState: randomCity.stateId, // Assuming stateId is UF
        address: faker.location.streetAddress(true),
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
    };

    const asset = await prisma.asset.create({ data: finalAssetData });
    assets.push(asset);
  }

  return assets;
}

async function createAssetsForAllStatuses(tenantId: string, categories: any[], subcategories: any[], judicialProcesses: any[], sellers: any[], cities: any[]) {
  const assets = [];
  const assetStatuses = Object.values(AssetStatus);
  const categoryMap = new Map(categories.map(c => [c.slug, c]));

  const assetCreators = {
    VEICULO: (category, subcategory) => ({
      title: `Veículo ${faker.vehicle.manufacturer()} ${faker.vehicle.model()}`,
      description: faker.vehicle.type(),
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
      runningCondition: faker.helpers.arrayElement(['Ótimo', 'Bom', 'Regular', 'Ruim']),
      bodyCondition: faker.helpers.arrayElement(['Perfeita', 'Pequenos Amassados', 'Amassado', 'Danificado']),
      tiresCondition: faker.helpers.arrayElement(['Novos', 'Bons', 'Meia Vida', 'Gastos']),
      hasKey: faker.datatype.boolean(),
    }),
    IMOVEL: (category, subcategory) => ({
      title: `Imóvel em ${faker.location.city()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      propertyRegistrationNumber: faker.string.numeric(10),
      iptuNumber: faker.string.numeric(10),
      isOccupied: faker.datatype.boolean(),
      totalArea: faker.number.float({ min: 50, max: 500, precision: 0.01 }),
      builtArea: faker.number.float({ min: 30, max: 300, precision: 0.01 }),
      bedrooms: faker.number.int({ min: 1, max: 5 }),
      suites: faker.number.int({ min: 0, max: 3 }),
      bathrooms: faker.number.int({ min: 1, max: 4 }),
      parkingSpaces: faker.number.int({ min: 0, max: 4 }),
      constructionType: faker.helpers.arrayElement(['Alvenaria', 'Madeira', 'Mista']),
      hasHabiteSe: faker.datatype.boolean(),
      zoningRestrictions: faker.helpers.arrayElement(['Residencial', 'Comercial', 'Mista']),
      amenities: JSON.stringify(faker.helpers.arrayElements(['Piscina', 'Churrasqueira', 'Academia', 'Salão de Festas'], faker.number.int({ min: 0, max: 4 }))),
    }),
    ELETRONICO: (category, subcategory) => ({
      title: `Eletrônico ${faker.commerce.productName()}`,
      description: faker.commerce.productDescription(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      brand: faker.company.name(),
      serialNumber: faker.string.uuid(),
      itemCondition: faker.helpers.arrayElement(['Novo', 'Usado', 'Recondicionado']),
      hasInvoice: faker.datatype.boolean(),
      hasWarranty: faker.datatype.boolean(),
    }),
    ELETRODOMESTICO: (category, subcategory) => ({
      title: `Eletrodoméstico ${faker.commerce.productName()}`,
      description: faker.commerce.productDescription(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      brand: faker.company.name(),
      serialNumber: faker.string.uuid(),
      itemCondition: faker.helpers.arrayElement(['Novo', 'Usado', 'Recondicionado']),
      applianceCapacity: `${faker.number.int({ min: 100, max: 500 })}L`,
      voltage: faker.helpers.arrayElement(['110V', '220V', 'Bivolt']),
      applianceType: faker.helpers.arrayElement(['Geladeira', 'Fogão', 'Máquina de Lavar', 'Microondas']),
      hasInvoice: faker.datatype.boolean(),
      hasWarranty: faker.datatype.boolean(),
    }),
    SEMOVENTE: (category, subcategory) => ({
      title: `Semovente ${faker.animal.type()} ${faker.person.firstName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      breed: faker.animal.breed(),
      age: `${faker.number.int({ min: 1, max: 10 })} anos`,
      sex: faker.helpers.arrayElement(['Macho', 'Fêmea']),
      weight: `${faker.number.int({ min: 50, max: 1000 })} kg`,
      individualId: faker.string.numeric(10),
      purpose: faker.helpers.arrayElement(['Corte', 'Leite', 'Reprodução', 'Trabalho']),
      isPregnant: faker.datatype.boolean(),
    }),
    IMPLEMENTO: (category, subcategory) => ({
      title: `Implemento Agrícola ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      brand: faker.company.name(),
      serialNumber: faker.string.uuid(),
      hoursUsed: faker.number.int({ min: 100, max: 5000 }),
      engineType: faker.helpers.arrayElement(['Diesel', 'Gasolina']),
      capacityOrPower: `${faker.number.int({ min: 50, max: 300 })} HP`,
      compliesWithNR: faker.datatype.boolean() ? 'Sim' : 'Não',
    }),
    EQUIPAMENTO_INDUSTRIAL: (category, subcategory) => ({
      title: `Equipamento Industrial ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      brand: faker.company.name(),
      serialNumber: faker.string.uuid(),
      hoursUsed: faker.number.int({ min: 1000, max: 10000 }),
      engineType: faker.helpers.arrayElement(['Elétrico', 'Hidráulico', 'Pneumático']),
      capacityOrPower: `${faker.number.int({ min: 10, max: 500 })} kW`,
      compliesWithNR: faker.datatype.boolean() ? 'Sim' : 'Não',
      installationLocation: faker.helpers.arrayElement(['Fábrica', 'Armazém', 'Canteiro de Obras']),
    }),
    TECNOLOGIA: (category, subcategory) => ({
      title: `Tecnologia ${faker.commerce.productName()}`,
      description: faker.commerce.productDescription(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      brand: faker.company.name(),
      serialNumber: faker.string.uuid(),
      itemCondition: faker.helpers.arrayElement(['Novo', 'Usado', 'Recondicionado']),
      specifications: faker.lorem.sentence(),
      hasInvoice: faker.datatype.boolean(),
      hasWarranty: faker.datatype.boolean(),
    }),
    MOVEIS: (category, subcategory) => ({
      title: `Móvel ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      furnitureType: faker.helpers.arrayElement(['Cadeira', 'Mesa', 'Sofá', 'Armário']),
      material: faker.helpers.arrayElement(['Madeira', 'Metal', 'Plástico', 'Tecido']),
      style: faker.helpers.arrayElement(['Moderno', 'Clássico', 'Rústico']),
      dimensions: `${faker.number.int({ min: 50, max: 200 })}x${faker.number.int({ min: 50, max: 200 })}x${faker.number.int({ min: 50, max: 200 })}cm`,
      pieceCount: faker.number.int({ min: 1, max: 5 }),
    }),
    JOIAS: (category, subcategory) => ({
      title: `Joia ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      jewelryType: faker.helpers.arrayElement(['Anel', 'Colar', 'Brinco', 'Pulseira']),
      metal: faker.helpers.arrayElement(['Ouro', 'Prata', 'Platina']),
      gemstones: faker.helpers.arrayElement(['Diamante', 'Esmeralda', 'Rubi', 'Safira', 'Nenhuma']),
      totalWeight: `${faker.number.float({ min: 1, max: 50, precision: 0.1 })}g`,
      jewelrySize: faker.helpers.arrayElement(['Pequeno', 'Médio', 'Grande']),
      authenticityCertificate: faker.datatype.boolean() ? faker.string.uuid() : undefined,
    }),
    ARTE: (category, subcategory) => ({
      title: `Obra de Arte ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      workType: faker.helpers.arrayElement(['Pintura', 'Escultura', 'Gravura', 'Fotografia']),
      artist: faker.person.fullName(),
      period: faker.helpers.arrayElement(['Contemporânea', 'Moderna', 'Clássica']),
      technique: faker.helpers.arrayElement(['Óleo sobre tela', 'Acrílica', 'Bronze', 'Mármore']),
      provenance: faker.lorem.sentence(),
    }),
    NAUTICA: (category, subcategory) => ({
      title: `Embarcação ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      boatType: faker.helpers.arrayElement(['Lancha', 'Veleiro', 'Jet Ski', 'Caiaque']),
      boatLength: `${faker.number.float({ min: 2, max: 20, precision: 0.1 })}m`,
      hullMaterial: faker.helpers.arrayElement(['Fibra de Vidro', 'Alumínio', 'Madeira']),
      onboardEquipment: faker.lorem.sentence(),
    }),
    ALIMENTOS: (category, subcategory) => ({
      title: `Alimento ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      productName: faker.commerce.productName(),
      quantity: `${faker.number.int({ min: 1, max: 100 })}kg`,
      packagingType: faker.helpers.arrayElement(['Saco', 'Caixa', 'Granel']),
      expirationDate: faker.date.future(),
      storageConditions: faker.helpers.arrayElement(['Ambiente', 'Refrigerado', 'Congelado']),
    }),
    METAIS_PRECIOSOS: (category, subcategory) => ({
      title: `Metal Precioso ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      preciousMetalType: faker.helpers.arrayElement(['Ouro', 'Prata', 'Platina', 'Paládio']),
      purity: faker.helpers.arrayElement(['24K', '18K', '925', '950']),
      totalWeight: `${faker.number.float({ min: 1, max: 1000, precision: 0.1 })}g`,
    }),
    PRODUTOS_FLORESTAIS: (category, subcategory) => ({
      title: `Produto Florestal ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      forestGoodsType: faker.helpers.arrayElement(['Madeira em Tora', 'Celulose', 'Carvão', 'Resina']),
      volumeOrQuantity: `${faker.number.int({ min: 1, max: 500 })}m³`,
      species: faker.animal.type(),
      dofNumber: faker.string.numeric(10),
    }),
  };

  for (const status of assetStatuses) {
    const assetTypeSlug = faker.helpers.arrayElement(Object.keys(assetCreators));
    const category = categoryMap.get(assetTypeSlug.toLowerCase());
    const subcategory = faker.helpers.arrayElement(subcategories.filter(s => s.parentCategoryId === category.id));

    const assetData = assetCreators[assetTypeSlug](category, subcategory);
    const imageInfo = generateImageUrls(3);
    const randomCity = faker.helpers.arrayElement(cities);

    const isJudicial = faker.datatype.boolean();

    const { categoryId, subcategoryId, ...restAssetData } = assetData;

    const finalAssetData: Prisma.AssetCreateInput = {
        ...restAssetData,
        publicId: faker.string.uuid(),
        evaluationValue: faker.number.float({ min: 1000, max: 150000, precision: 0.01 }),
        status: status,
        tenant: { connect: { id: tenantId } },
        category: categoryId ? { connect: { id: categoryId } } : undefined,
        subcategory: subcategoryId ? { connect: { id: subcategoryId } } : undefined,
        judicialProcess: isJudicial && judicialProcesses.length > 0 ? { connect: { id: faker.helpers.arrayElement(judicialProcesses).id } } : undefined,
        seller: !isJudicial && sellers.length > 0 ? { connect: { id: faker.helpers.arrayElement(sellers).id } } : undefined,
        imageUrl: imageInfo.imageUrl,
        imageMediaId: imageInfo.imageMediaId,
        galleryImageUrls: imageInfo.galleryImageUrls as Prisma.JsonArray,
        mediaItemIds: imageInfo.mediaItemIds as Prisma.JsonArray,
        locationCity: randomCity.name,
        locationState: randomCity.stateId,
        address: faker.location.streetAddress(true),
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
    };

    const asset = await prisma.asset.create({ data: finalAssetData });
    assets.push(asset);
    console.log(`Created asset with status: ${status}`);
  }
  return assets;
}

async function createAuction(tenantId: string, auctioneers: any[], sellers: any[], cities: any[], type: AuctionType, title: string, courts: any[], districts: any[], branches: any[]) {
    const randomCity = faker.helpers.arrayElement(cities);
    const isJudicial = type === AuctionType.JUDICIAL;
    const auction = await prisma.auction.create({
      data: {
        title: `${title} #${faker.string.uuid().substring(0, 4)}`,
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(Object.values(AuctionStatus).filter(s => s !== 'RASCUNHO' && s !== 'EM_PREPARACAO')), // Exclude RASCUNHO and EM_PREPARACAO for active auctions
        auctionDate: faker.date.soon(),
        endDate: faker.date.future(),
        auctionType: type,
        auctionMethod: faker.helpers.arrayElement(Object.values(AuctionMethod)),
        participation: faker.helpers.arrayElement(Object.values(Participation)),
        onlineUrl: faker.internet.url(),
        address: faker.location.streetAddress(true),
        zipCode: faker.location.zipCode(),
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
        softCloseEnabled: faker.datatype.boolean(),
        softCloseMinutes: faker.number.int({ min: 1, max: 5 }),
        allowInstallmentBids: faker.datatype.boolean(),
        automaticBiddingEnabled: faker.datatype.boolean(),
        silentBiddingEnabled: faker.datatype.boolean(),
        floorPrice: faker.number.float({ min: 1000, max: 10000, precision: 0.01 }),
        tenant: { connect: { id: tenantId } },
        auctioneer: { connect: { id: faker.helpers.arrayElement(auctioneers).id } },
        seller: !isJudicial && sellers.length > 0 ? { connect: { id: faker.helpers.arrayElement(sellers).id } } : undefined,
        city: { connect: { id: randomCity.id } },
        state: { connect: { id: randomCity.stateId } },
        court: isJudicial && courts.length > 0 ? { connect: { id: faker.helpers.arrayElement(courts).id } } : undefined,
        district: isJudicial && districts.length > 0 ? { connect: { id: faker.helpers.arrayElement(districts).id } } : undefined,
        branch: isJudicial && branches.length > 0 ? { connect: { id: faker.helpers.arrayElement(branches).id } } : undefined,
        auctionCertificateUrl: faker.internet.url(),
        evaluationReportUrl: faker.internet.url(),
        sellingBranch: faker.lorem.words(3),
      },
    });
    return auction;
}

async function createLotsForAuction(auction: any, availableAssets: any[], numberOfLots: number, cities: any[]) {
    const createdLots = [];
    const assetsForAuction = faker.helpers.arrayElements(availableAssets, numberOfLots);

    for (const asset of assetsForAuction) {
        const imageInfo = generateImageUrls(3);
        const randomCity = faker.helpers.arrayElement(cities);

        const lot = await prisma.lot.create({
            data: {
                auctionId: auction.id,
                number: `${createdLots.length + 1}`,
                title: asset.title,
                description: asset.description,
                initialPrice: asset.evaluationValue,
                price: asset.evaluationValue * 1.1, // Simulate a slightly higher current price
                secondInitialPrice: asset.evaluationValue * 0.9,
                bidIncrementStep: faker.number.float({ min: 50, max: 500, precision: 0.01 }),
                status: faker.helpers.arrayElement(Object.values(LotStatus).filter(s => s !== 'RASCUNHO')),
                isFeatured: faker.datatype.boolean(),
                isExclusive: faker.datatype.boolean(),
                discountPercentage: faker.datatype.boolean() ? faker.number.int({ min: 5, max: 20 }) : null,
                imageUrl: imageInfo.imageUrl,
                imageMediaId: imageInfo.imageMediaId,
                galleryImageUrls: imageInfo.galleryImageUrls as Prisma.JsonArray,
                mediaItemIds: imageInfo.mediaItemIds as Prisma.JsonArray,
                type: auction.auctionType, // Use auction type for lot type
                condition: faker.helpers.arrayElement(['Novo', 'Usado - Bom', 'Usado - Regular', 'Danificado']),
                winningBidTermUrl: faker.internet.url(),
                allowInstallmentBids: faker.datatype.boolean(),
                isRelisted: faker.datatype.boolean(),
                relistCount: faker.number.int({ min: 0, max: 3 }),
                endDate: faker.date.future(),
                lotSpecificAuctionDate: faker.date.soon(),
                secondAuctionDate: faker.date.future(),
                tenantId: auction.tenantId,
                categoryId: asset.categoryId,
                subcategoryId: asset.subcategoryId,
                sellerId: asset.sellerId || auction.sellerId, // Use asset seller or auction seller
                auctioneerId: auction.auctioneerId,
                cityId: randomCity.id,
                stateId: randomCity.stateId,
                cityName: randomCity.name,
                stateUf: randomCity.stateId,
                latitude: faker.location.latitude(),
                longitude: faker.location.longitude(),
                mapAddress: faker.location.streetAddress(true),
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

async function createLotsForAllStatuses(auction: any, availableAssets: any[], cities: any[]) {
  const lots = [];
  const lotStatuses = Object.values(LotStatus);

  for (const status of lotStatuses) {
    const asset = faker.helpers.arrayElement(availableAssets.filter(a => a.status === AssetStatus.DISPONIVEL));
    if (!asset) {
        console.warn(`No available assets to create lot with status: ${status}. Skipping.`);
        continue;
    }
    const imageInfo = generateImageUrls(3);
    const randomCity = faker.helpers.arrayElement(cities);

    const lot = await prisma.lot.create({
        data: {
            auctionId: auction.id,
            number: `${lots.length + 1}-STATUS`,
            title: `Lot with status ${status} - ${asset.title}`,
            description: asset.description,
            initialPrice: asset.evaluationValue,
            price: asset.evaluationValue * 1.1,
            secondInitialPrice: asset.evaluationValue * 0.9,
            bidIncrementStep: faker.number.float({ min: 50, max: 500, precision: 0.01 }),
            status: status,
            isFeatured: faker.datatype.boolean(),
            isExclusive: faker.datatype.boolean(),
            discountPercentage: faker.datatype.boolean() ? faker.number.int({ min: 5, max: 20 }) : null,
            imageUrl: imageInfo.imageUrl,
            imageMediaId: imageInfo.imageMediaId,
            galleryImageUrls: imageInfo.galleryImageUrls as Prisma.JsonArray,
            mediaItemIds: imageInfo.mediaItemIds as Prisma.JsonArray,
            type: auction.auctionType,
            condition: faker.helpers.arrayElement(['Novo', 'Usado - Bom', 'Usado - Regular', 'Danificado']),
            winningBidTermUrl: faker.internet.url(),
            allowInstallmentBids: faker.datatype.boolean(),
            isRelisted: faker.datatype.boolean(),
            relistCount: faker.number.int({ min: 0, max: 3 }),
            endDate: faker.date.future(),
            lotSpecificAuctionDate: faker.date.soon(),
            secondAuctionDate: faker.date.future(),
            tenantId: auction.tenantId,
            categoryId: asset.categoryId,
            subcategoryId: asset.subcategoryId,
            sellerId: asset.sellerId || auction.sellerId,
            auctioneerId: auction.auctioneerId,
            cityId: randomCity.id,
            stateId: randomCity.stateId,
            cityName: randomCity.name,
            stateUf: randomCity.stateId,
            latitude: faker.location.latitude(),
            longitude: faker.location.longitude(),
            mapAddress: faker.location.streetAddress(true),
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
    lots.push(lotWithAsset);
    console.log(`Created lot with status: ${status}`);
  }
  return lots;
}

async function createAuctionsForAllStatuses(tenantId: string, auctioneers: any[], sellers: any[], cities: any[], courts: any[], districts: any[], branches: any[]) {
  const auctions = [];
  const auctionStatuses = Object.values(AuctionStatus);

  for (const status of auctionStatuses) {
    const type = faker.helpers.arrayElement(Object.values(AuctionType));
    const isJudicial = type === AuctionType.JUDICIAL;
    const randomCity = faker.helpers.arrayElement(cities);

    const auction = await prisma.auction.create({
      data: {
        title: `Auction with status ${status} #${faker.string.uuid().substring(0, 4)}`,
        description: faker.lorem.paragraph(),
        status: status,
        auctionDate: faker.date.soon(),
        endDate: faker.date.future(),
        auctionType: type,
        auctionMethod: faker.helpers.arrayElement(Object.values(AuctionMethod)),
        participation: faker.helpers.arrayElement(Object.values(Participation)),
        onlineUrl: faker.internet.url(),
        address: faker.location.streetAddress(true),
        zipCode: faker.location.zipCode(),
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
        softCloseEnabled: faker.datatype.boolean(),
        softCloseMinutes: faker.number.int({ min: 1, max: 5 }),
        allowInstallmentBids: faker.datatype.boolean(),
        automaticBiddingEnabled: faker.datatype.boolean(),
        silentBiddingEnabled: faker.datatype.boolean(),
        floorPrice: faker.number.float({ min: 1000, max: 10000, precision: 0.01 }),
        tenant: { connect: { id: tenantId } },
        auctioneer: { connect: { id: faker.helpers.arrayElement(auctioneers).id } },
        seller: !isJudicial && sellers.length > 0 ? { connect: { id: faker.helpers.arrayElement(sellers).id } } : undefined,
        city: { connect: { id: randomCity.id } },
        state: { connect: { id: randomCity.stateId } },
        court: isJudicial && courts.length > 0 ? { connect: { id: faker.helpers.arrayElement(courts).id } } : undefined,
        district: isJudicial && districts.length > 0 ? { connect: { id: faker.helpers.arrayElement(districts).id } } : undefined,
        branch: isJudicial && branches.length > 0 ? { connect: { id: faker.helpers.arrayElement(branches).id } } : undefined,
        auctionCertificateUrl: faker.internet.url(),
        evaluationReportUrl: faker.internet.url(),
        sellingBranch: faker.lorem.words(3),
      },
    });
    auctions.push(auction);
    console.log(`Created auction with status: ${status}`);
  }
  return auctions;
}

async function createCapitalCityAuctionsAndLots(tenantId: string, auctioneers: any[], sellers: any[], cities: any[], capitalCities: any[], availableAssets: any[], courts: any[], districts: any[], branches: any[]) {
  const createdAuctions = [];
  const createdLots = [];

  for (const capitalCity of capitalCities) {
    const type = faker.helpers.arrayElement(Object.values(AuctionType));
    const isJudicial = type === AuctionType.JUDICIAL;
    const auction = await prisma.auction.create({
      data: {
        title: `Leilão na Capital ${capitalCity.name} #${faker.string.uuid().substring(0, 4)}`,
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(Object.values(AuctionStatus).filter(s => s !== 'RASCUNHO' && s !== 'EM_PREPARACAO')),
        auctionDate: faker.date.soon(),
        endDate: faker.date.future(),
        auctionType: type,
        auctionMethod: faker.helpers.arrayElement(Object.values(AuctionMethod)),
        participation: faker.helpers.arrayElement(Object.values(Participation)),
        onlineUrl: faker.internet.url(),
        address: `${faker.location.streetAddress()}, ${capitalCity.name} - ${capitalCity.stateId}`, // Address for capital city
        zipCode: faker.location.zipCode(),
        latitude: faker.location.latitude(), // Placeholder, ideally center of capital
        longitude: faker.location.longitude(), // Placeholder, ideally center of capital
        softCloseEnabled: faker.datatype.boolean(),
        softCloseMinutes: faker.number.int({ min: 1, max: 5 }),
        allowInstallmentBids: faker.datatype.boolean(),
        automaticBiddingEnabled: faker.datatype.boolean(),
        silentBiddingEnabled: faker.datatype.boolean(),
        floorPrice: faker.number.float({ min: 1000, max: 10000, precision: 0.01 }),
        tenant: { connect: { id: tenantId } },
        auctioneer: { connect: { id: faker.helpers.arrayElement(auctioneers).id } },
        seller: !isJudicial && sellers.length > 0 ? { connect: { id: faker.helpers.arrayElement(sellers).id } } : undefined,
        city: { connect: { id: capitalCity.id } },
        state: { connect: { id: capitalCity.stateId } },
        court: isJudicial && courts.length > 0 ? { connect: { id: faker.helpers.arrayElement(courts).id } } : undefined,
        district: isJudicial && districts.length > 0 ? { connect: { id: faker.helpers.arrayElement(districts).id } } : undefined,
        branch: isJudicial && branches.length > 0 ? { connect: { id: faker.helpers.arrayElement(branches).id } } : undefined,
        auctionCertificateUrl: faker.internet.url(),
        evaluationReportUrl: faker.internet.url(),
        sellingBranch: faker.lorem.words(3),
      },
    });
    createdAuctions.push(auction);
    console.log(`Created auction in capital: ${capitalCity.name}`);

    const suitableAssets = availableAssets.filter(a => (type === AuctionType.JUDICIAL ? !!a.judicialProcessId : !a.judicialProcessId) && a.status === AssetStatus.DISPONIVEL);
    if (suitableAssets.length > 0) {
        const asset = faker.helpers.arrayElement(suitableAssets);
        const imageInfo = generateImageUrls(3);

        const lot = await prisma.lot.create({
            data: {
                auctionId: auction.id,
                number: `1-CAPITAL`,
                title: `Lot na Capital ${capitalCity.name} - ${asset.title}`,
                description: asset.description,
                initialPrice: asset.evaluationValue,
                price: asset.evaluationValue * 1.1,
                secondInitialPrice: asset.evaluationValue * 0.9,
                bidIncrementStep: faker.number.float({ min: 50, max: 500, precision: 0.01 }),
                status: faker.helpers.arrayElement(Object.values(LotStatus).filter(s => s !== 'RASCUNHO')),
                isFeatured: faker.datatype.boolean(),
                isExclusive: faker.datatype.boolean(),
                discountPercentage: faker.datatype.boolean() ? faker.number.int({ min: 5, max: 20 }) : null,
                imageUrl: imageInfo.imageUrl,
                imageMediaId: imageInfo.imageMediaId,
                galleryImageUrls: imageInfo.galleryImageUrls as Prisma.JsonArray,
                mediaItemIds: imageInfo.mediaItemIds as Prisma.JsonArray,
                type: auction.auctionType,
                condition: faker.helpers.arrayElement(['Novo', 'Usado - Bom', 'Usado - Regular', 'Danificado']),
                winningBidTermUrl: faker.internet.url(),
                allowInstallmentBids: faker.datatype.boolean(),
                isRelisted: faker.datatype.boolean(),
                relistCount: faker.number.int({ min: 0, max: 3 }),
                endDate: faker.date.future(),
                lotSpecificAuctionDate: faker.date.soon(),
                secondAuctionDate: faker.date.future(),
                tenantId: auction.tenantId,
                categoryId: asset.categoryId,
                subcategoryId: asset.subcategoryId,
                sellerId: asset.sellerId || auction.sellerId,
                auctioneerId: auction.auctioneerId,
                cityId: capitalCity.id,
                stateId: capitalCity.stateId,
                cityName: capitalCity.name,
                stateUf: capitalCity.stateId,
                latitude: faker.location.latitude(),
                longitude: faker.location.longitude(),
                mapAddress: faker.location.streetAddress(true),
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
        createdLots.push(lot);
        console.log(`Created lot in capital: ${capitalCity.name}`);
    } else {
        console.warn(`No suitable assets for lot in capital: ${capitalCity.name}. Skipping lot creation.`);
    }
  }
  return { createdAuctions, createdLots };
}

async function createAuctionStages(auctions: any[]) {
  const existingStages = await prisma.auctionStage.findMany({ take: 1 });
  if (existingStages.length > 0) {
    console.log('AuctionStage table already has data. Skipping creation.');
    return [];
  }

  console.log('Creating auction stages...');
  const createdStages = [];
  for (const auction of auctions) {
    for (let i = 0; i < 2; i++) {
      const startDate = faker.date.soon();
      const endDate = faker.date.future({ refDate: startDate });
      const stage = await prisma.auctionStage.create({
        data: {
          name: `Stage ${i + 1} for ${auction.title}`,
          startDate: startDate,
          endDate: endDate,
          auctionId: auction.id,
          initialPrice: faker.number.float({ min: 100, max: 10000, precision: 0.01 }),
        },
      });
      createdStages.push(stage);
    }
  }
  console.log(`Created ${createdStages.length} auction stages.`);
  return createdStages;
}

async function createUserWins(bidders: any[], auctions: any[]) {
  const userWins = [];
  console.log('Creating user wins...');
  for (const bidder of bidders) {
    const randomAuction = faker.helpers.arrayElement(auctions.filter(a => a.status === AuctionStatus.ENCERRADO || a.status === AuctionStatus.FINALIZADO));
    if (!randomAuction) continue;

    const lotsInAuction = await prisma.lot.findMany({ where: { auctionId: randomAuction.id } });
    if (lotsInAuction.length === 0) continue;

    const randomLot = faker.helpers.arrayElement(lotsInAuction);

    const userWin = await prisma.userWin.upsert({
      where: { lotId: randomLot.id },
      update: {},
      create: {
        userId: bidder.id,
        lotId: randomLot.id,
        winningBidAmount: faker.number.float({ min: randomLot.initialPrice || 1000, max: (randomLot.initialPrice || 1000) * 2, precision: 0.01 }),
        winDate: faker.date.recent(),
        paymentStatus: faker.helpers.arrayElement(['PENDENTE', 'PAGO']),
        invoiceUrl: faker.internet.url(),
      },
    });
    userWins.push(userWin);
    console.log(`Created win for user ${bidder.email} on lot ${randomLot.title}`);
  }
  return userWins;
}

async function createInstallmentPayments(userWins: any[], installmentsPerWin: number) {
  console.log('Creating installment payments...');
  const createdInstallments = [];
  for (const userWin of userWins) {
    for (let i = 0; i < installmentsPerWin; i++) {
      const amount = userWin.winningBidAmount / installmentsPerWin;
      const dueDate = faker.date.future({ refDate: userWin.winDate, years: 1 });
      const status = i === 0 ? 'PAGO' : faker.helpers.arrayElement(['PENDENTE', 'ATRASADO']);

      const installment = await prisma.installmentPayment.create({
        data: {
          amount: amount,
          dueDate: dueDate,
          status: status,
          userWinId: userWin.id,
          installmentNumber: i + 1,
          paymentDate: status === 'PAGO' ? faker.date.recent({ refDate: dueDate }) : undefined,
          paymentMethod: status === 'PAGO' ? faker.helpers.arrayElement(['Cartão de Crédito', 'Boleto', 'Pix']) : undefined,
          transactionId: status === 'PAGO' ? faker.string.uuid() : undefined,
          lots: { connect: { id: userWin.lotId } }, // Connect to the lot via the many-to-many relation
        },
      });
      createdInstallments.push(installment);
      console.log(`Created installment ${i + 1} for win ${userWin.id}`);
    }
  }
  return createdInstallments;
}

// =================================================================
// BOILERPLATE DATA FUNCTIONS (can be customized if needed)
// =================================================================

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
    const slug = `tj-${state.uf.toLowerCase()}-${i}-${faker.string.uuid().substring(0, 4)}`; // Added UUID part for uniqueness
    const court = await prisma.court.upsert({
      where: { slug: slug }, // Use slug for upsert where clause
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
        const name = `Comarca de ${city.name} #${i+1}-${faker.string.uuid().substring(0, 4)}`; // Added UUID part for uniqueness
        const slug = faker.helpers.slugify(name).toLowerCase(); // Slugify the unique name
        const district = await prisma.judicialDistrict.upsert({
            where: { name: name }, // Use name for upsert where clause
            update: {},
            create: {
                name: name,
                slug: slug,
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
    const processNumber = faker.string.numeric(20);
    const judicialProcess = await prisma.judicialProcess.create({
      data: {
        publicId: faker.string.uuid(),
        processNumber: processNumber,
        tenantId: tenantId,
        courtId: faker.helpers.arrayElement(courts).id,
        branchId: branch.id,
        districtId: branch.districtId,
        sellerId: faker.helpers.arrayElement(sellers).id, // A judicial process can have a seller
      },
    });
    judicialProcesses.push(judicialProcess);
  }
  console.log(`Created ${judicialProcesses.length} judicial processes.`);
  return judicialProcesses;
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