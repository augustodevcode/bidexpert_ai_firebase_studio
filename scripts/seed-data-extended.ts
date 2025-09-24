// scripts/seed-data-extended.ts
import { PrismaClient, Prisma, AuctionType, AssetStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// =================================================================
// SEED CONFIGURATION
// =================================================================
const seedConfig = {
  users: {
    bidders: 5,
  },
  sellers: 5,
  auctioneers: 3,
  judicial: {
    courts: 3,
    districts: 5,
    branches: 5,
    processes: 4,
  },
  assets: {
    // Total assets to create for EACH main category (Imóveis, Veículos, Eletrônicos)
    totalPerCategory: 5, 
    judicialRatio: 0.4, // 40% of assets will be linked to a judicial process
  },
  auctions: {
    judicial: 2,
    extrajudicial: 2,
    particular: 1,
    lotsPerAuction: 3,
  },
};


// =================================================================
// SEEDING SCRIPT
// =================================================================

async function main() {
  console.log('Starting extended seeding with controlled scenarios...');

  // --- 1. FETCH PRESERVED DATA ---
  console.log('Fetching preserved data (Tenant, Admin User, Roles)...');
  const tenant = await prisma.tenant.findUnique({ where: { id: '1' } });
  if (!tenant) {
    console.error('Tenant with ID 1 not found. Please ensure it exists.');
    return;
  }
  console.log(`Using tenant: ${tenant.name}`);

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@bidexpert.com.br' } });
  if (!adminUser) {
    console.error('Admin user admin@bidexpert.com.br not found. Please ensure it exists.');
    return;
  }
  console.log(`Using admin user: ${adminUser.email}`);

  const roles = await prisma.role.findMany();
  if (roles.length === 0) {
    console.error('Roles not found. Please ensure they exist.');
    return;
  }
  console.log(`Found ${roles.length} roles.`);
  const userRole = roles.find(r => r.nameNormalized === 'USER');
  if (!userRole) {
      console.error('USER role not found.');
      return;
  }

  // --- 2. CREATE NEW DATA ---
  console.log('Creating new data based on configuration...');

  const bidders = await createBidders(tenant.id, userRole.id, seedConfig.users.bidders);
  const { states, cities } = await createStatesAndCities();
  const { categories, subcategories } = await createCategoriesAndSubcategories();
  const sellers = await createSellers(tenant.id, seedConfig.sellers);
  const auctioneers = await createAuctioneers(tenant.id, seedConfig.auctioneers);
  
  // Judicial Entities
  const courts = await createCourts(states, seedConfig.judicial.courts);
  const districts = await createJudicialDistricts(courts, cities, seedConfig.judicial.districts);
  const branches = await createJudicialBranches(districts, seedConfig.judicial.branches);
  const judicialProcesses = await createJudicialProcesses(tenant.id, courts, branches, sellers, seedConfig.judicial.processes);

  // --- 3. CREATE ASSETS (NEW LOGIC) ---
  console.log('Creating assets with varied scenarios...');
  const createdAssets = await createAssets(tenant.id, categories, subcategories, judicialProcesses, sellers);
  console.log(`Created ${createdAssets.length} assets.`);

  let availableAssets = [...createdAssets];

  // --- 4. CREATE AUCTIONS AND LOTS (NEW LOGIC) ---
  console.log('Creating auctions and lots...');

  const auctionTypes = [
      ...Array(seedConfig.auctions.judicial).fill(AuctionType.JUDICIAL),
      ...Array(seedConfig.auctions.extrajudicial).fill(AuctionType.EXTRAJUDICIAL),
      ...Array(seedConfig.auctions.particular).fill(AuctionType.PARTICULAR),
  ];

  for (const type of auctionTypes) {
    const isJudicial = type === AuctionType.JUDICIAL;
    const suitableAssets = availableAssets.filter(a => (isJudicial ? !!a.judicialProcessId : !a.judicialProcessId) && a.status === AssetStatus.DISPONIVEL);

    if (suitableAssets.length < seedConfig.auctions.lotsPerAuction) {
        console.warn(`Not enough available ${type} assets to create a full auction. Skipping.`);
        continue;
    }

    const auction = await createAuction(tenant.id, auctioneers, sellers, cities, type, `Leilão ${type} de Teste`);
    const lots = await createLotsForAuction(auction, suitableAssets, seedConfig.auctions.lotsPerAuction);
    
    // Refresh available assets pool
    const lottedAssetIds = lots.flatMap(l => l.assets.map(a => a.assetId));
    availableAssets = availableAssets.filter(a => !lottedAssetIds.includes(a.id));

    console.log(`Created ${type} auction "${auction.title}" with ${lots.length} lots.`);
  }

  console.log('Seeding finished successfully!');
}

// =================================================================
// DATA CREATION FUNCTIONS
// =================================================================

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
                password: 'password', // In a real project, use hash
                habilitationStatus: 'HABILITADO',
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
    const seller = await prisma.seller.create({
      data: {
        publicId: faker.string.uuid(),
        slug: `${slug}-${i}`, // ensure slug is unique
        name: name,
        email: faker.internet.email(),
        tenantId: tenantId,
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
        slug: `${slug}-${i}`, // ensure slug is unique
        name: name,
        email: faker.internet.email(),
        tenantId: tenantId,
      },
    });
    auctioneers.push(auctioneer);
  }
  console.log(`Created ${auctioneers.length} auctioneers.`);
  return auctioneers;
}

async function createAssets(tenantId: string, categories: any[], subcategories: any[], judicialProcesses: any[], sellers: any[]) {
  const assets = [];
  const vehicleCategory = categories.find(c => c.slug === 'veiculos');
  const propertyCategory = categories.find(c => c.slug === 'imoveis');
  const electronicsCategory = categories.find(c => c.slug === 'eletronicos');

  const assetCreators = {
    VEICULO: () => {
      const subcategory = faker.helpers.arrayElement(subcategories.filter(s => s.parentCategoryId === vehicleCategory.id));
      return {
        title: `Veículo ${faker.vehicle.manufacturer()} ${faker.vehicle.model()}`,
        description: faker.vehicle.vin(),
        categoryId: vehicleCategory.id,
        subcategoryId: subcategory.id,
        plate: faker.vehicle.vrm(),
        make: faker.vehicle.manufacturer(),
        model: faker.vehicle.model(),
        year: faker.number.int({ min: 2010, max: 2023 }),
        color: faker.vehicle.color(),
      };
    },
    IMOVEL: () => {
        const subcategory = faker.helpers.arrayElement(subcategories.filter(s => s.parentCategoryId === propertyCategory.id));
        return {
            title: `Imóvel em ${faker.location.city()}`,
            description: faker.location.streetAddress(true),
            categoryId: propertyCategory.id,
            subcategoryId: subcategory.id,
            isOccupied: faker.datatype.boolean(),
            bedrooms: faker.number.int({ min: 1, max: 5 }),
            suites: faker.number.int({ min: 0, max: 3 }),
            parkingSpaces: faker.number.int({ min: 1, max: 4 }),
        };
    },
    ELETRONICO: () => {
        const subcategory = faker.helpers.arrayElement(subcategories.filter(s => s.parentCategoryId === electronicsCategory.id));
        return {
            title: `Eletrônico ${faker.commerce.productName()}`,
            description: faker.commerce.productDescription(),
            categoryId: electronicsCategory.id,
            subcategoryId: subcategory.id,
            brand: faker.company.name(),
            itemCondition: faker.helpers.arrayElement(['Novo', 'Usado', 'Recondicionado']),
        };
    }
  };

  const totalAssetsToCreate = seedConfig.assets.totalPerCategory * Object.keys(assetCreators).length;
  const numJudicial = Math.floor(totalAssetsToCreate * seedConfig.assets.judicialRatio);

  for (let i = 0; i < totalAssetsToCreate; i++) {
    const assetType = i % 3 === 0 ? 'VEICULO' : (i % 3 === 1 ? 'IMOVEL' : 'ELETRONICO');
    const assetData = assetCreators[assetType]();

    const isJudicial = assets.filter(a => a.judicialProcessId).length < numJudicial;

    const { categoryId, subcategoryId, ...restAssetData } = assetData;

    const finalAssetData: Prisma.AssetCreateInput = {
        ...restAssetData, // Spread the rest of the assetData
        publicId: faker.string.uuid(),
        evaluationValue: faker.number.float({ min: 1000, max: 150000 }),
        status: AssetStatus.DISPONIVEL,
        tenant: { connect: { id: tenantId } },
        category: categoryId ? { connect: { id: categoryId } } : undefined,
        subcategory: subcategoryId ? { connect: { id: subcategoryId } } : undefined,
        judicialProcess: isJudicial && judicialProcesses.length > 0 ? { connect: { id: faker.helpers.arrayElement(judicialProcesses).id } } : undefined,
        seller: !isJudicial && sellers.length > 0 ? { connect: { id: faker.helpers.arrayElement(sellers).id } } : undefined,
    };

    const asset = await prisma.asset.create({ data: finalAssetData });
    assets.push(asset);
  }

  return assets;
}

async function createAuction(tenantId: string, auctioneers: any[], sellers: any[], cities: any[], type: AuctionType, title: string) {
    const auction = await prisma.auction.create({
      data: {
        title: `${title} #${faker.string.uuid().substring(0, 4)}`,
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(['ABERTO_PARA_LANCES', 'EM_BREVE']),
        auctionDate: faker.date.soon(),
        endDate: faker.date.future(),
        auctionType: type,
        tenant: { connect: { id: tenantId } },
        auctioneer: { connect: { id: faker.helpers.arrayElement(auctioneers).id } },
        seller: type !== 'JUDICIAL' ? { connect: { id: faker.helpers.arrayElement(sellers).id } } : undefined,
        city: { connect: { id: faker.helpers.arrayElement(cities).id } },
      },
    });
    return auction;
}

async function createLotsForAuction(auction: any, availableAssets: any[], numberOfLots: number) {
    const createdLots = [];
    const assetsForAuction = faker.helpers.arrayElements(availableAssets, numberOfLots);

    for (const asset of assetsForAuction) {
        const lot = await prisma.lot.create({
            data: {
                auctionId: auction.id,
                number: `${createdLots.length + 1}`,
                title: asset.title,
                description: asset.description,
                initialPrice: asset.evaluationValue,
                price: 0,
                status: 'EM_BREVE',
                tenantId: auction.tenantId,
                categoryId: asset.categoryId,
                subcategoryId: asset.subcategoryId,
                type: auction.auctionType,
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


// =================================================================
// BOILERPLATE DATA FUNCTIONS (can be customized if needed)
// =================================================================

async function createStatesAndCities() {
  const statesData = [
    { uf: 'SP', name: 'São Paulo', capital: 'São Paulo' },
    { uf: 'RJ', name: 'Rio de Janeiro', capital: 'Rio de Janeiro' },
    { uf: 'MG', name: 'Minas Gerais', capital: 'Belo Horizonte' },
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
        const name = `Comarca de ${city.name} #${i+1}`;
        const slug = faker.helpers.slugify(name).toLowerCase() + `-${faker.string.uuid().substring(0, 4)}`; // Added UUID part for uniqueness
        const district = await prisma.judicialDistrict.upsert({
            where: { slug: slug }, // Use slug for upsert where clause
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