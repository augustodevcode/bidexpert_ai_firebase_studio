import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { v4 as uuidv4 } from 'uuid';

// Import services
import { AssetService } from '../src/services/asset.service';
import { AuctionService } from '../src/services/auction.service';
import { AuctioneerService } from '../src/services/auctioneer.service';
import { CategoryService } from '../src/services/category.service';
import { CityService } from '../src/services/city.service';
import { CourtService } from '../src/services/court.service';
import { JudicialBranchService } from '../src/services/judicial-branch.service';
import { JudicialDistrictService } from '../src/services/judicial-district.service';
import { JudicialProcessService } from '../src/services/judicial-process.service';
import { LotService } from '../src/services/lot.service';
import { RoleService } from '../src/services/role.service';
import { SellerService } from '../src/services/seller.service';
import { StateService } from '../src/services/state.service';
import { SubcategoryService } from '../src/services/subcategory.service';
import { TenantService } from '../src/services/tenant.service';
import { UserService } from '../src/services/user.service';
import { DocumentTypeService } from '../src/services/document-type.service';
import { DocumentService } from '../src/services/document.service';
import { MediaService } from '../src/services/media.service';
import { PlatformSettingsService } from '../src/services/platform-settings.service';
import { VehicleMakeService } from '../src/services/vehicle-make.service';
import { VehicleModelService } from '../src/services/vehicle-model.service';
import { BidService } from '../src/services/bid.service';
import { UserWinService } from '../src/services/user-win.service';
import { InstallmentPaymentService } from '../src/services/installment-payment.service';
import { SubscriberService } from '../src/services/subscriber.service';

const prisma = new PrismaClient();

// Simplified constants for quick test
const TOTAL_USERS = 10;
const TOTAL_SELLERS = 5;
const TOTAL_AUCTIONEERS = 3;
const TOTAL_ASSETS = 50;
const TOTAL_AUCTIONS = 5;
const MAX_LOTS_PER_AUCTION = 3;
const MAX_ASSETS_PER_LOT = 3;
const MAX_BIDS_PER_LOT = 5;

// Service instances
const services = {
  asset: new AssetService(),
  auction: new AuctionService(),
  auctioneer: new AuctioneerService(),
  category: new CategoryService(),
  city: new CityService(),
  court: new CourtService(),
  judicialBranch: new JudicialBranchService(),
  judicialDistrict: new JudicialDistrictService(),
  judicialProcess: new JudicialProcessService(),
  lot: new LotService(),
  role: new RoleService(),
  seller: new SellerService(),
  state: new StateService(),
  subcategory: new SubcategoryService(),
  tenant: new TenantService(),
  user: new UserService(),
  documentType: new DocumentTypeService(),
  document: new DocumentService(),
  media: new MediaService(),
  platformSettings: new PlatformSettingsService(),
  vehicleMake: new VehicleMakeService(),
  vehicleModel: new VehicleModelService(),
  bid: new BidService(),
  userWin: new UserWinService(),
  installmentPayment: new InstallmentPaymentService(),
  subscriber: new SubscriberService(),
};

// Entity store for tracking created entities
const entityStore: any = {
  tenantId: '',
  roles: {},
  users: [],
  categories: [],
  states: [],
  cities: [],
  courts: [],
  judicialDistricts: [],
  judicialBranches: [],
  sellers: [],
  auctioneers: [],
  judicialProcesses: [],
  assets: [],
  auctions: [],
  lots: [],
  mediaItems: [],
  documentTypes: {},
  userWins: [],
  vehicleMakes: [],
  vehicleModels: [],
};

async function cleanupPreviousData() {
  console.log('Cleaning up previous data...');
  // Delete in reverse order of dependencies
  await prisma.assetsOnLots.deleteMany({});
  await prisma.bid.deleteMany({});
  await prisma.installmentPayment.deleteMany({});
  await prisma.userWin.deleteMany({});
  await prisma.lot.deleteMany({});
  await prisma.auction.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.judicialProcess.deleteMany({});
  await prisma.seller.deleteMany({});
  await prisma.auctioneer.deleteMany({});
  await prisma.usersOnRoles.deleteMany({});
  await prisma.usersOnTenants.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.vehicleModel.deleteMany({});
  await prisma.vehicleMake.deleteMany({});
  await prisma.subcategory.deleteMany({});
  await prisma.lotCategory.deleteMany({});
  await prisma.judicialBranch.deleteMany({});
  await prisma.judicialDistrict.deleteMany({});
  await prisma.court.deleteMany({});
  await prisma.mediaItem.deleteMany({});
  await prisma.documentType.deleteMany({});
  await prisma.subscriber.deleteMany({});
  await prisma.city.deleteMany({});
  await prisma.state.deleteMany({});
  await prisma.tenant.deleteMany({ where: { id: { not: '1' } } });
  console.log('Cleanup completed.');
}

async function seedCoreInfra() {
  console.log('Seeding core infrastructure...');
  
  // Create Tenant
  const tenantResult = await services.tenant.createTenant({ name: 'BidExpert Test', subdomain: 'test' });
  if (!tenantResult.success || !tenantResult.tenant) throw new Error(tenantResult.message);
  entityStore.tenantId = tenantResult.tenant.id;
  console.log(`Tenant created: ${tenantResult.tenant.name}`);

  // Create Roles
  const roleNames = ['ADMIN', 'USER', 'BIDDER'];
  for (const name of roleNames) {
    const role = await services.role.findOrCreateRole({ name, nameNormalized: name, description: `Role ${name}` });
    entityStore.roles[name] = role.id;
  }
  console.log(`${roleNames.length} roles created.`);

  // Create Admin User
  const adminResult = await services.user.createUser({
    email: 'admin@test.com',
    password: 'admin123',
    fullName: 'Test Administrator',
    habilitationStatus: 'HABILITADO',
    accountType: 'PHYSICAL',
    roleIds: [entityStore.roles.ADMIN],
    tenantId: entityStore.tenantId,
  });
  if (!adminResult.success || !adminResult.userId) throw new Error(adminResult.message);
  const admin = await services.user.getUserById(adminResult.userId);
  if (!admin) throw new Error('Failed to fetch admin user.');
  entityStore.users.push({ ...admin, roleNames: ['ADMIN'] });
  console.log(`Admin user created: ${admin.email}`);

  // Create Document Types
  const docTypes = [
    { name: 'CPF', description: 'Cadastro de Pessoa Física', isRequired: true, appliesTo: 'PHYSICAL' },
    { name: 'RG', description: 'Registro Geral', isRequired: true, appliesTo: 'PHYSICAL' },
  ];
  for (const docType of docTypes) {
    const created = await services.documentType.upsertDocumentType(docType as any);
    entityStore.documentTypes[docType.name] = created.id;
  }
  console.log(`${docTypes.length} document types created.`);
}

async function seedCategoriesAndVehicles() {
  console.log('Seeding categories and vehicles...');
  
  // Create categories
  const categories = ['Imóveis', 'Veículos', 'Eletrônicos'];
  for (const catName of categories) {
    const catResult = await services.category.createCategory({ name: catName, description: `Category ${catName}` });
    if (catResult.success && catResult.category) {
      // Create subcategories
      const subcategories = [`Sub ${catName} 1`, `Sub ${catName} 2`];
      for (const subcatName of subcategories) {
        await services.subcategory.createSubcategory({ 
          name: subcatName, 
          parentCategoryId: catResult.category.id,
          description: `Subcategory ${subcatName}`,
          displayOrder: faker.number.int({ min: 0, max: 10 }),
          iconUrl: faker.image.url(), // Fake image URL instead of empty string
          iconMediaId: faker.string.uuid(), // Fake UUID instead of empty string
          dataAiHintIcon: faker.lorem.words(3) // Fake AI hint instead of empty string
        });
      }
      const fullCategory = await prisma.lotCategory.findUnique({ where: { id: catResult.category.id }, include: { subcategories: true } });
      if (fullCategory) entityStore.categories.push(fullCategory);
    }
  }
  console.log(`${entityStore.categories.length} categories created.`);

  // Create vehicle makes and models
  const vehicleData: Record<string, string[]> = {
    "Toyota": ["Corolla", "Camry"],
    "Honda": ["Civic", "CR-V"],
  };
  
  for (const makeName of Object.keys(vehicleData)) {
    const makeResult = await services.vehicleMake.createVehicleMake({ name: makeName });
    if (makeResult.success && makeResult.makeId) {
      const make = await prisma.vehicleMake.findUnique({ where: { id: makeResult.makeId } });
      if (make) {
        entityStore.vehicleMakes.push(make);
        for (const modelName of vehicleData[makeName]) {
          const modelResult = await services.vehicleModel.createVehicleModel({ name: modelName, makeId: makeResult.makeId });
          if (modelResult.success && modelResult.modelId) {
            const model = await prisma.vehicleModel.findUnique({ where: { id: modelResult.modelId } });
            if (model) {
              entityStore.vehicleModels.push(model);
            }
          }
        }
      }
    }
  }
  console.log(`${entityStore.vehicleMakes.length} vehicle makes and ${entityStore.vehicleModels.length} models created.`);
}

async function seedLocations() {
  console.log('Seeding locations...');
  
  // Create states and cities
  const locations = [
    { "nome": "São Paulo", "sigla": "SP", "cidades": ["São Paulo", "Campinas"] },
    { "nome": "Rio de Janeiro", "sigla": "RJ", "cidades": ["Rio de Janeiro", "Niterói"] },
  ];
  
  for (const stateData of locations) {
    const stateResult = await services.state.createState({ name: stateData.nome, uf: stateData.sigla });
    if (stateResult.success && stateResult.stateId) {
      const createdState = await prisma.state.findUnique({ where: { id: stateResult.stateId } });
      if (createdState) {
        entityStore.states.push(createdState);
        for (const cityName of stateData.cidades) {
          const cityResult = await services.city.createCity({ name: cityName, stateId: createdState.id, ibgeCode: faker.number.int({min: 1000000, max: 9999999}).toString() });
          if (cityResult.success && cityResult.cityId) {
            const createdCity = await prisma.city.findUnique({ where: { id: cityResult.cityId } });
            if (createdCity) {
              entityStore.cities.push(createdCity);
            }
          }
        }
      }
    }
  }
  console.log(`${entityStore.states.length} states and ${entityStore.cities.length} cities created.`);
}

async function seedParticipants() {
  console.log('Seeding participants...');
  
  // Create auctioneers
  for (let i = 0; i < TOTAL_AUCTIONEERS; i++) {
    const result = await services.auctioneer.createAuctioneer(entityStore.tenantId.toString(), {
      name: `Auctioneer ${i + 1}`,
      registrationNumber: `JUCESP/TEST/${faker.number.int({ min: 1000, max: 9999 })}`,
      email: `auctioneer${i + 1}@${faker.internet.domainName()}`,
      phone: faker.phone.number(),
      description: faker.lorem.paragraph(),
      website: faker.internet.url(),
      contactName: faker.person.fullName(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      logoUrl: faker.image.avatar(),
      logoMediaId: faker.string.uuid(),
      dataAiHintLogo: faker.lorem.words(5),
      userId: '', // This will be set by the system when a user is linked
    } as any); // Using 'as any' to bypass TypeScript errors for now
    if (result.success && result.auctioneerId) {
      const auctioneer = await prisma.auctioneer.findUnique({ where: { id: result.auctioneerId } });
      if (auctioneer) entityStore.auctioneers.push(auctioneer);
    }
  }
  console.log(`${entityStore.auctioneers.length} auctioneers created.`);

  // Create sellers
  for (let i = 0; i < TOTAL_SELLERS; i++) {
    const isJudicial = i % 2 === 0;
    const result = await services.seller.createSeller(entityStore.tenantId.toString(), {
      name: isJudicial ? `Judicial Seller ${i + 1}` : `Private Seller ${i + 1}`,
      isJudicial,
    } as any);
    if (result.success && result.sellerId) {
      const seller = await prisma.seller.findUnique({ where: { id: result.sellerId } });
      if (seller) entityStore.sellers.push(seller);
    }
  }
  console.log(`${entityStore.sellers.length} sellers created.`);

  // Create users
  for (let i = 0; i < TOTAL_USERS; i++) {
    const email = `user${i}@test.com`;
    const userResult = await services.user.createUser({
      email,
      password: 'user123',
      fullName: faker.person.fullName(),
      habilitationStatus: 'HABILITADO',
      accountType: 'PHYSICAL',
      roleIds: [entityStore.roles.BIDDER.toString(), entityStore.roles.USER.toString()],
      tenantId: entityStore.tenantId.toString(),
    });
    if (userResult.success && userResult.userId) {
      const user = await services.user.getUserById(userResult.userId);
      if(user) entityStore.users.push({ ...user, roleNames: ['BIDDER', 'USER'] });
    }
  }
  console.log(`${TOTAL_USERS} users created.`);
}

async function seedAssets() {
  console.log(`Seeding ${TOTAL_ASSETS} assets...`);
  
  for (let i = 0; i < TOTAL_ASSETS; i++) {
    const category = faker.helpers.arrayElement(entityStore.categories) as any;
    const subcategory = faker.helpers.arrayElement(category.subcategories) as any;
    const seller = faker.helpers.arrayElement(entityStore.sellers) as any;
    const city = faker.helpers.arrayElement(entityStore.cities) as any;
    const state = entityStore.states.find((s: any) => s.id === city.stateId) as any;

    const result = await services.asset.createAsset(entityStore.tenantId.toString(), {
      title: `${faker.commerce.productName()} (Asset ${i})`,
      description: faker.lorem.paragraph(),
      status: 'DISPONIVEL',
      evaluationValue: faker.number.int({ min: 500, max: 250000 }),
      categoryId: category.id.toString(),
      subcategoryId: subcategory.id.toString(),
      sellerId: seller.id.toString(),
      cityId: city.id.toString(),
      stateId: state?.id.toString(),
    } as any);
    if (result.success && result.assetId) {
      const asset = await prisma.asset.findUnique({ where: { id: result.assetId } });
      if (asset) {
        entityStore.assets.push(asset);
      }
    }
    
    // Show progress every 10 assets
    if ((i + 1) % 10 === 0) {
      console.log(`Created ${i + 1}/${TOTAL_ASSETS} assets...`);
    }
  }
  console.log(`${entityStore.assets.length} assets created.`);
}

async function seedAuctionsAndLots() {
  console.log('Seeding auctions and lots...');
  
  for (let i = 0; i < TOTAL_AUCTIONS; i++) {
    const seller = faker.helpers.arrayElement(entityStore.sellers) as any;
    const auctionType = seller.isJudicial ? 'JUDICIAL' : 'EXTRAJUDICIAL';
    const category = faker.helpers.arrayElement(entityStore.categories) as any;
    const auctionDate = faker.date.soon({ days: 15 });

    const auctionResult = await services.auction.createAuction(entityStore.tenantId.toString(), {
      title: `Auction ${i + 1} - ${category.name}`,
      status: 'ABERTO_PARA_LANCES',
      auctionType,
      auctioneerId: (faker.helpers.arrayElement(entityStore.auctioneers) as any).id.toString(),
      sellerId: seller.id.toString(),
      categoryId: category.id.toString(),
      auctionStages: [
        { name: '1st Stage', startDate: auctionDate, endDate: new Date(auctionDate.getTime() + 3 * 24 * 60 * 60 * 1000) },
      ]
    } as any);

    if (!auctionResult.success || !auctionResult.auctionId) continue;
    
    const numLots = faker.number.int({ min: 1, max: MAX_LOTS_PER_AUCTION });
    const availableAssets = entityStore.assets.filter((a: any) => a.status === 'DISPONIVEL' && a.sellerId === seller.id);

    for (let j = 0; j < numLots; j++) {
      const assetsForLot = faker.helpers.arrayElements(availableAssets, { min: 1, max: MAX_ASSETS_PER_LOT });
      if (assetsForLot.length === 0) continue;

      const mainAsset = assetsForLot[0] as any;
      const lotResult = await services.lot.createLot({
        title: `Lot of ${mainAsset.title}`,
        auctionId: auctionResult.auctionId,
        assetIds: assetsForLot.map((a: any) => a.id.toString()),
        categoryId: mainAsset.categoryId?.toString(),
        price: mainAsset.evaluationValue ? Number(mainAsset.evaluationValue) : faker.number.int({min: 100, max: 10000}),
        status: 'ABERTO_PARA_LANCES',
      }, entityStore.tenantId.toString(), entityStore.users[0].id.toString());

      if(lotResult.success && lotResult.lotId) {
        const lot = await prisma.lot.findUnique({where: {id: lotResult.lotId}});
        if(lot) entityStore.lots.push(lot);
      }
    }
    const auction = await prisma.auction.findUnique({ where: { id: auctionResult.auctionId }, include: { stages: true } });
    if (auction) {
      entityStore.auctions.push(auction);
    }
  }
  console.log(`${entityStore.auctions.length} auctions and ${entityStore.lots.length} lots created.`);
}

async function seedInteractions() {
  console.log('Seeding interactions...');
  
  const lotsForBidding = entityStore.lots.filter((l: any) => l.status === 'ABERTO_PARA_LANCES');
  const bidderUsers = entityStore.users.filter((u: any) => u.roleNames.includes('BIDDER'));

  for (const lot of lotsForBidding) {
    let currentPrice = lot.price ? Number(lot.price) : 100;
    
    // Create bids
    const numBids = faker.number.int({ min: 1, max: MAX_BIDS_PER_LOT });
    for (let i = 0; i < numBids; i++) {
      const bidder = faker.helpers.arrayElement(bidderUsers) as any;
      currentPrice += faker.number.int({ min: 50, max: 500 });
      await services.bid.createBid({
        lot: { connect: { id: lot.id } },
        auction: { connect: { id: lot.auctionId } },
        bidder: { connect: { id: bidder.id } },
        tenant: { connect: { id: entityStore.tenantId } },
        bidderDisplay: bidder.fullName || 'Anonymous',
        amount: currentPrice,
      });
    }

    // Create a win for this lot
    const winner = faker.helpers.arrayElement(bidderUsers) as any;
    const winResult = await services.userWin.create({
      user: { connect: { id: winner.id } },
      lot: { connect: { id: lot.id } },
      winningBidAmount: new Prisma.Decimal(currentPrice),
    });
    if (winResult) {
      entityStore.userWins.push(winResult as any);
      await prisma.lot.update({ where: { id: lot.id }, data: { status: 'VENDIDO', winnerId: winner.id } });
      
      // Create installment payments
      const paymentResult = await services.installmentPayment.createInstallmentsForWin(winResult as any, faker.number.int({ min: 1, max: 3 }));
      if (paymentResult.success && paymentResult.payments.length > 0) {
        // Mark first payment as paid
        await services.installmentPayment.updatePaymentStatus(paymentResult.payments[0].id.toString(), 'PAGO');
      }
    }
  }
  console.log(`Created interactions for ${lotsForBidding.length} lots.`);
}

async function main() {
  console.log('🚀 Starting quick test seed process...');
  console.log('=====================================================');

  try {
    await cleanupPreviousData();
    await seedCoreInfra();
    await seedCategoriesAndVehicles();
    await seedLocations();
    await seedParticipants();
    await seedAssets();
    await seedAuctionsAndLots();
    await seedInteractions();

    console.log('\n=====================================================');
    console.log('✅ Quick test seed completed successfully!');
    console.log('=====================================================');
    
    // Show summary
    const counts = {
      tenants: await prisma.tenant.count(),
      users: await prisma.user.count(),
      categories: await prisma.lotCategory.count(),
      assets: await prisma.asset.count(),
      auctions: await prisma.auction.count(),
      lots: await prisma.lot.count(),
      bids: await prisma.bid.count(),
      wins: await prisma.userWin.count(),
    };
    
    console.log('\nSummary:');
    console.log(`- Tenants: ${counts.tenants}`);
    console.log(`- Users: ${counts.users}`);
    console.log(`- Categories: ${counts.categories}`);
    console.log(`- Assets: ${counts.assets}`);
    console.log(`- Auctions: ${counts.auctions}`);
    console.log(`- Lots: ${counts.lots}`);
    console.log(`- Bids: ${counts.bids}`);
    console.log(`- Wins: ${counts.wins}`);
    
  } catch (error) {
    console.error('\n❌ Error during seeding process:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();