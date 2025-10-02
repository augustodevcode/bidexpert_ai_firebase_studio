/**
 * @fileoverview Script de seed completo para a plataforma BidExpert.
 * Popula TODAS as tabelas do banco de dados usando a camada de serviços.
 * 
 * Para executar: `npx tsx scripts/seed-data-extended-complete.ts`
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { AuctionService } from '../src/services/auction.service';
import { LotService } from '../src/services/lot.service';
import { UserService } from '../src/services/user.service';
import { SellerService } from '../src/services/seller.service';
import { AuctioneerService } from '../src/services/auctioneer.service';
import { CategoryService } from '../src/services/category.service';
import { SubcategoryService } from '../src/services/subcategory.service';
import { AssetService } from '../src/services/asset.service';
import { JudicialProcessService } from '../src/services/judicial-process.service';
import { CourtService } from '../src/services/court.service';
import { JudicialDistrictService } from '../src/services/judicial-district.service';
import { JudicialBranchService } from '../src/services/judicial-branch.service';
import { StateService } from '../src/services/state.service';
import { CityService } from '../src/services/city.service';
// import { LotQuestionService } from '../src/services/lot-question.service';
// import { ReviewService } from '../src/services/review.service';
// import { BidService } from '../src/services/bid.service';
import { UserWinService } from '../src/services/user-win.service';
import { DirectSaleOfferService } from '../src/services/direct-sale-offer.service';
// import { InstallmentPaymentService } from '../src/services/installment-payment.service';
import { NotificationService } from '../src/services/notification.service';
import { ContactMessageService } from '../src/services/contact-message.service';
import { DocumentTemplateService } from '../src/services/document-template.service';
import { RoleService } from '../src/services/role.service';
import {
  AuctionStatus,
  AuctionType,
  LotStatus,
  UserHabilitationStatus,
  PaymentStatus,
  AssetStatus,
  AccountType,
  ProcessPartyType,
  DocumentTemplateType,
} from '@prisma/client';

const prisma = new PrismaClient();

// --- Helper Functions ---
const log = (message: string, level = 0) => {
  console.log(`${'  '.repeat(level)}- ${message}`);
};

const randomEnum = <T extends object>(e: T): T[keyof T] => {
  const values = Object.values(e);
  return values[Math.floor(Math.random() * values.length)];
};

const entityStore: {
  tenantId: string;
  roles: Record<string, string>;
  users: Record<string, string>;
  categories: Record<string, { id: string; subcategoryIds: string[] }>;
  states: Record<string, string>;
  cities: Record<string, string>;
  courts: Record<string, string>;
  judicialDistricts: Record<string, string>;
  judicialBranches: Record<string, string>;
  sellers: string[];
  auctioneers: string[];
  judicialProcesses: string[];
  assets: { id: string; status: AssetStatus }[];
  auctions: string[];
  lots: string[];
  vehicleMakes: Record<string, string>;
  vehicleModels: string[];
  mediaItems: string[];
  documentTypes: string[];
} = {
  tenantId: '1',
  roles: {},
  users: {},
  categories: {},
  states: {},
  cities: {},
  courts: {},
  judicialDistricts: {},
  judicialBranches: {},
  sellers: [],
  auctioneers: [],
  judicialProcesses: [],
  assets: [],
  auctions: [],
  lots: [],
  vehicleMakes: {},
  vehicleModels: [],
  mediaItems: [],
  documentTypes: [],
};

// --- Service Instances ---
const userService = new UserService();
const roleService = new RoleService();
const sellerService = new SellerService();
const auctioneerService = new AuctioneerService();
const categoryService = new CategoryService();
const subcategoryService = new SubcategoryService();
const assetService = new AssetService();
const stateService = new StateService();
const cityService = new CityService();
const courtService = new CourtService();
const judicialDistrictService = new JudicialDistrictService();
const judicialBranchService = new JudicialBranchService();
const judicialProcessService = new JudicialProcessService();
const auctionService = new AuctionService();
const lotService = new LotService();
const bidService = new BidService();
const userWinService = new UserWinService();
const directSaleOfferService = new DirectSaleOfferService();
// const installmentPaymentService = new InstallmentPaymentService();
const notificationService = new NotificationService();
const contactMessageService = new ContactMessageService();
const documentTemplateService = new DocumentTemplateService();
// const lotQuestionService = new LotQuestionService();
// const reviewService = new ReviewService();

// --- Seeding Phases ---

async function seedCoreInfra() {
  log('Phase 1: Seeding Core Infrastructure...', 0);

  // 1.1. Tenant (garantir que existe)
  log('Ensuring Tenant exists...', 1);
  const tenant = await prisma.tenant.upsert({
    where: { id: entityStore.tenantId },
    update: {},
    create: {
      id: entityStore.tenantId,
      name: 'BidExpert Platform',
      subdomain: 'bidexpert',
      domain: 'bidexpert.com',
    },
  });
  log(`Tenant "${tenant.name}" ready.`, 2);

  // 1.2. Roles
  log('Seeding Roles...', 1);
  const roleNames = ['ADMIN', 'USER', 'BIDDER', 'SELLER_ADMIN', 'AUCTIONEER_ADMIN'];
  for (const name of roleNames) {
    const result = await roleService.createRole({
      name,
      nameNormalized: name,
      description: `${name} role`,
    });
    if (result.success && result.roleId) {
      entityStore.roles[name] = result.roleId;
      log(`Role "${name}" created.`, 2);
    } else {
      const existingRole = await prisma.role.findUnique({ where: { nameNormalized: name } });
      if (existingRole) {
        entityStore.roles[name] = existingRole.id;
        log(`Role "${name}" already exists.`, 2);
      }
    }
  }

  // 1.3. Admin User
  log('Seeding Admin User...', 1);
  const adminData = {
    email: 'admin@bidexpert.com',
    password: 'admin123',
    fullName: 'Admin BidExpert',
    habilitationStatus: UserHabilitationStatus.HABILITADO,
    accountType: AccountType.PHYSICAL,
    roleIds: [entityStore.roles.ADMIN],
    tenantId: entityStore.tenantId,
  };
  const adminResult = await userService.createUser(adminData);
  if (adminResult.success && adminResult.userId) {
    entityStore.users.admin = adminResult.userId;
    log(`Admin user created: ${adminData.email}`, 2);
  } else {
    const existingAdmin = await userService.findUserByEmail(adminData.email);
    if (existingAdmin) {
      entityStore.users.admin = existingAdmin.id;
      log(`Admin user already exists: ${adminData.email}`, 2);
    }
  }

  // 1.4. Document Types
  log('Seeding Document Types...', 1);
  const docTypes = [
    { name: 'CPF', description: 'Cadastro de Pessoa Física', isRequired: true, appliesTo: 'PHYSICAL' },
    { name: 'RG', description: 'Registro Geral', isRequired: true, appliesTo: 'PHYSICAL' },
    { name: 'Comprovante de Residência', description: 'Comprovante de endereço', isRequired: true, appliesTo: 'BOTH' },
    { name: 'CNPJ', description: 'Cadastro Nacional de Pessoa Jurídica', isRequired: true, appliesTo: 'LEGAL' },
    { name: 'Contrato Social', description: 'Contrato social da empresa', isRequired: true, appliesTo: 'LEGAL' },
  ];
  
  for (const docType of docTypes) {
    const created = await prisma.documentType.upsert({
      where: { name: docType.name },
      update: {},
      create: docType,
    });
    entityStore.documentTypes.push(created.id);
    log(`Document Type "${docType.name}" created.`, 2);
  }
}

async function seedBaseData() {
  log('Phase 2: Seeding Base Data...', 0);

  // 2.1. Categories & Subcategories
  log('Seeding Categories and Subcategories...', 1);
  const categoryData = {
    'Veículos': ['Carros', 'Motos', 'Caminhões'],
    'Imóveis': ['Apartamentos', 'Casas', 'Terrenos'],
    'Eletrônicos': ['Celulares', 'Notebooks', 'TVs'],
  };
  for (const catName of Object.keys(categoryData)) {
    const catResult = await categoryService.createCategory({
      name: catName,
      description: `Categoria de ${catName}`,
    });
    if (catResult.success && catResult.categoryId) {
      const categoryId = catResult.categoryId;
      entityStore.categories[catName] = { id: categoryId, subcategoryIds: [] };
      log(`Category "${catName}" created.`, 2);

      for (const subcatName of categoryData[catName as keyof typeof categoryData]) {
        const subcatResult = await subcategoryService.createSubcategory({
          name: subcatName,
          parentCategoryId: categoryId,
        });
        if (subcatResult.success && subcatResult.subcategoryId) {
          entityStore.categories[catName].subcategoryIds.push(subcatResult.subcategoryId);
          log(`Subcategory "${subcatName}" created under "${catName}".`, 3);
        }
      }
    }
  }

  // 2.2. Location Data
  log('Seeding Location Data (States and Cities)...', 1);
  const locationData = { SP: 'São Paulo', RJ: 'Rio de Janeiro', MG: 'Belo Horizonte' };
  for (const [uf, cityName] of Object.entries(locationData)) {
    const stateResult = await stateService.createState({ name: uf, uf });
    if (stateResult.success && stateResult.stateId) {
      entityStore.states[uf] = stateResult.stateId;
      log(`State "${uf}" created.`, 2);
      const cityResult = await cityService.createCity({
        name: cityName,
        stateId: stateResult.stateId,
      });
      if (cityResult.success && cityResult.cityId) {
        entityStore.cities[cityName] = cityResult.cityId;
        log(`City "${cityName}" created.`, 3);
      }
    }
  }

  // 2.3. Vehicle Makes and Models
  log('Seeding Vehicle Makes and Models...', 1);
  const vehicleData = {
    'Ford': ['Ka', 'Fiesta', 'Focus', 'Ranger'],
    'Chevrolet': ['Onix', 'Prisma', 'S10', 'Tracker'],
    'Volkswagen': ['Gol', 'Polo', 'Tiguan', 'Amarok'],
  };

  for (const [makeName, models] of Object.entries(vehicleData)) {
    const makeSlug = makeName.toLowerCase().replace(/\s+/g, '-');
    const make = await prisma.vehicleMake.upsert({
      where: { slug: makeSlug },
      update: {},
      create: { name: makeName, slug: makeSlug },
    });
    entityStore.vehicleMakes[makeName] = make.id;
    log(`Vehicle Make "${makeName}" created.`, 2);

    for (const modelName of models) {
      const modelSlug = `${makeSlug}-${modelName.toLowerCase().replace(/\s+/g, '-')}`;
      const model = await prisma.vehicleModel.upsert({
        where: { makeId_name: { makeId: make.id, name: modelName } },
        update: {},
        create: { name: modelName, slug: modelSlug, makeId: make.id },
      });
      entityStore.vehicleModels.push(model.id);
      log(`Vehicle Model "${modelName}" created under "${makeName}".`, 3);
    }
  }
}

async function seedParticipants() {
  log('Phase 3: Seeding Participants...', 0);

  // 3.1. Auctioneers
  log('Seeding Auctioneers...', 1);
  for (let i = 0; i < 3; i++) {
    const name = `Leiloeiro Oficial ${i + 1}`;
    const data = {
      name,
      email: faker.internet.email(),
      phone: faker.phone.number(),
    };
    const result = await auctioneerService.createAuctioneer(entityStore.tenantId, data);
    if (result.success && result.auctioneerId) {
      entityStore.auctioneers.push(result.auctioneerId);
      log(`Auctioneer "${name}" created.`, 2);
    }
  }

  // 3.2. Sellers
  log('Seeding Sellers...', 1);
  for (let i = 0; i < 5; i++) {
    const name = `Vendedor Extrajudicial ${i + 1}`;
    const data = {
      name,
      email: faker.internet.email(),
      isJudicial: false,
    };
    const result = await sellerService.createSeller(entityStore.tenantId, data);
    if (result.success && result.sellerId) {
      entityStore.sellers.push(result.sellerId);
      log(`Seller "${name}" created.`, 2);
    }
  }

  // 3.3. Bidder Users
  log('Seeding Bidder Users...', 1);
  for (let i = 0; i < 10; i++) {
    const email = `arrematante${i}@bidexpert.com`;
    const userData = {
      email,
      password: 'bidder123',
      fullName: faker.person.fullName(),
      habilitationStatus: UserHabilitationStatus.HABILITADO,
      accountType: AccountType.PHYSICAL,
      roleIds: [entityStore.roles.BIDDER, entityStore.roles.USER],
      tenantId: entityStore.tenantId,
    };
    const result = await userService.createUser(userData);
    if (result.success && result.userId) {
      entityStore.users[`bidder${i}`] = result.userId;
      log(`Bidder user created: ${email}`, 2);
    } else {
      const existingUser = await userService.findUserByEmail(email);
      if (existingUser) {
        entityStore.users[`bidder${i}`] = existingUser.id;
        log(`Bidder user already exists: ${email}`, 2);
      }
    }
  }

  // 3.4. Subscribers (Newsletter)
  log('Seeding Subscribers...', 1);
  for (let i = 0; i < 5; i++) {
    await prisma.subscriber.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        preferences: { categories: ['Veículos', 'Imóveis'] },
        tenantId: entityStore.tenantId,
      },
    });
  }
  log('5 subscribers created.', 2);
}

async function seedJudicialData() {
  log('Phase 4: Seeding Judicial Data...', 0);

  // 4.1. Courts, Districts, Branches
  log('Seeding Courts, Districts, and Branches...', 1);
  const courtResult = await courtService.createCourt({
    name: 'Tribunal de Justiça de São Paulo',
    stateUf: 'SP',
  });
  if (courtResult.success && courtResult.courtId) {
    entityStore.courts.TJSP = courtResult.courtId;
    log('Court "TJSP" created.', 2);

    const districtResult = await judicialDistrictService.createDistrict({
      name: 'Comarca da Capital',
      courtId: courtResult.courtId,
      stateId: entityStore.states.SP,
    });
    if (districtResult.success && districtResult.districtId) {
      entityStore.judicialDistricts.Capital = districtResult.districtId;
      log('District "Capital" created.', 3);

      const branchResult = await judicialBranchService.createBranch({
        name: '1ª Vara Cível',
        districtId: districtResult.districtId,
      });
      if (branchResult.success && branchResult.branchId) {
        entityStore.judicialBranches.Vara1 = branchResult.branchId;
        log('Branch "1ª Vara Cível" created.', 4);

        // Judicial seller linked to branch
        const sellerName = `Vendedor Judicial - 1ª Vara Cível`;
        const sellerData = {
          name: sellerName,
          email: faker.internet.email(),
          isJudicial: true,
          judicialBranchId: branchResult.branchId,
        };
        const sellerResult = await sellerService.createSeller(entityStore.tenantId, sellerData);
        if (sellerResult.success && sellerResult.sellerId) {
          entityStore.sellers.push(sellerResult.sellerId);
          log(`Judicial Seller "${sellerName}" created.`, 5);
        }
      }
    }
  }

  // 4.2. Judicial Processes
  log('Seeding Judicial Processes...', 1);
  const judicialSeller = await prisma.seller.findFirst({ where: { isJudicial: true } });
  if (judicialSeller) {
    for (let i = 0; i < 3; i++) {
      const data = {
        processNumber: `0001234-56.202${i}.8.26.0100`,
        courtId: entityStore.courts.TJSP,
        districtId: entityStore.judicialDistricts.Capital,
        branchId: entityStore.judicialBranches.Vara1,
        sellerId: judicialSeller.id,
        parties: [
          { name: faker.person.fullName(), partyType: ProcessPartyType.AUTOR },
          { name: faker.person.fullName(), partyType: ProcessPartyType.REU },
        ],
      };
      const result = await judicialProcessService.createJudicialProcess(entityStore.tenantId, data);
      if (result.success && result.processId) {
        entityStore.judicialProcesses.push(result.processId);
        log(`Judicial Process "${data.processNumber}" created.`, 2);
      }
    }
  }
}

async function seedMediaLibrary() {
  log('Phase 5: Seeding Media Library...', 0);
  
  // Criar alguns itens de mídia fictícios
  for (let i = 0; i < 10; i++) {
    const mediaItem = await prisma.mediaItem.create({
      data: {
        fileName: `image-${i + 1}.jpg`,
        mimeType: 'image/jpeg',
        sizeBytes: faker.number.int({ min: 100000, max: 5000000 }),
        storagePath: `/uploads/media/image-${i + 1}.jpg`,
        urlOriginal: `https://storage.example.com/media/image-${i + 1}.jpg`,
        urlThumbnail: `https://storage.example.com/media/thumb-image-${i + 1}.jpg`,
        altText: faker.lorem.words(3),
        title: faker.lorem.words(5),
        uploadedByUserId: entityStore.users.admin,
      },
    });
    entityStore.mediaItems.push(mediaItem.id);
  }
  log(`${entityStore.mediaItems.length} media items created.`, 1);
}

async function seedAssets() {
  log('Phase 6: Seeding Assets...', 0);
  const sellers = await prisma.seller.findMany({ where: { tenantId: entityStore.tenantId } });
  if (sellers.length === 0) throw new Error('No sellers found to assign assets.');

  for (let i = 0; i < 20; i++) {
    const categoryName = faker.helpers.arrayElement(Object.keys(entityStore.categories));
    const category = entityStore.categories[categoryName];
    const seller = faker.helpers.arrayElement(sellers);

    const data = {
      title: `${faker.vehicle.vehicle()} (Asset ${i})`,
      description: faker.lorem.paragraph(),
      status: AssetStatus.DISPONIVEL,
      categoryId: category.id,
      subcategoryId: faker.helpers.arrayElement(category.subcategoryIds),
      sellerId: seller.id,
      evaluationValue: faker.number.int({ min: 5000, max: 150000 }),
      locationCity: faker.location.city(),
      locationState: faker.location.state({ abbreviated: true }),
      address: faker.location.streetAddress(),
      make: faker.vehicle.manufacturer(),
      model: faker.vehicle.model(),
      year: faker.number.int({ min: 2010, max: 2023 }),
    };
    const result = await assetService.createAsset(entityStore.tenantId, data);
    if (result.success && result.assetId) {
      entityStore.assets.push({ id: result.assetId, status: AssetStatus.DISPONIVEL });
    }
  }
  log(`${entityStore.assets.length} assets created.`, 1);
}

async function seedAuctionsAndLots() {
  log('Phase 7: Seeding Auctions and Lots...', 0);

  for (let i = 0; i < 5; i++) {
    const isJudicial = i % 2 === 0;
    const seller = await prisma.seller.findFirst({
      where: { tenantId: entityStore.tenantId, isJudicial },
    });
    if (!seller) continue;

    const auctionData = {
      title: `Grande Leilão ${isJudicial ? 'Judicial' : 'Extrajudicial'} #${i + 1}`,
      description: faker.lorem.sentences(3),
      status: randomEnum(AuctionStatus),
      auctionType: isJudicial ? AuctionType.JUDICIAL : AuctionType.EXTRAJUDICIAL,
      auctioneerId: faker.helpers.arrayElement(entityStore.auctioneers),
      sellerId: seller.id,
      judicialProcessId: isJudicial
        ? faker.helpers.arrayElement(entityStore.judicialProcesses)
        : undefined,
      auctionStages: [
        {
          name: '1ª Praça',
          startDate: faker.date.soon(),
          endDate: faker.date.soon({ days: 7 }),
        },
        {
          name: '2ª Praça',
          startDate: faker.date.soon({ days: 8 }),
          endDate: faker.date.soon({ days: 15 }),
        },
      ],
    };

    const auctionResult = await auctionService.createAuction(entityStore.tenantId, auctionData);
    if (auctionResult.success && auctionResult.auctionId) {
      const auctionId = auctionResult.auctionId;
      entityStore.auctions.push(auctionId);
      log(`Auction "${auctionData.title}" created.`, 1);

      // Populate many-to-many relationships
      if (isJudicial) {
        await prisma.$executeRaw`
          INSERT IGNORE INTO _AuctionToCourt (A, B) 
          VALUES (${auctionId}, ${entityStore.courts.TJSP})
        `;
        await prisma.$executeRaw`
          INSERT IGNORE INTO _AuctionToJudicialDistrict (A, B) 
          VALUES (${auctionId}, ${entityStore.judicialDistricts.Capital})
        `;
        await prisma.$executeRaw`
          INSERT IGNORE INTO _AuctionToJudicialBranch (A, B) 
          VALUES (${auctionId}, ${entityStore.judicialBranches.Vara1})
        `;
      }

      // Link categories
      const categoryId = faker.helpers.arrayElement(
        Object.values(entityStore.categories)
      ).id;
      await prisma.$executeRaw`
        INSERT IGNORE INTO _AuctionToLotCategory (A, B) 
        VALUES (${auctionId}, ${categoryId})
      `;

      const availableAssets = entityStore.assets.filter((a) => a.status === 'DISPONIVEL');
      const assetsForLots = availableAssets.slice(0, 3);
      if (assetsForLots.length === 0) continue;

      for (const asset of assetsForLots) {
        const category = await prisma.asset.findUnique({
          where: { id: asset.id },
          select: { categoryId: true },
        });
        const lotData = {
          title: `Lote para ${asset.id.substring(0, 4)}`,
          description: faker.lorem.sentence(),
          auctionId: auctionId,
          assetIds: [asset.id],
          type: category?.categoryId || entityStore.categories['Veículos'].id,
          initialPrice: faker.number.int({ min: 4000, max: 100000 }),
          status: LotStatus.EM_BREVE,
        };
        const lotResult = await lotService.createLot(lotData, entityStore.tenantId);
        if (lotResult.success && lotResult.lotId) {
          entityStore.lots.push(lotResult.lotId);
          log(`Lot "${lotData.title}" created for auction ${auctionId}.`, 2);
          const assetIndex = entityStore.assets.findIndex((a) => a.id === asset.id);
          if (assetIndex > -1) entityStore.assets[assetIndex].status = AssetStatus.LOTEADO;
        }
      }
    }
  }
}

async function seedInteractions() {
  log('Phase 8: Seeding User Interactions...', 0);
  
  const openLots = await prisma.lot.findMany({
    where: { status: LotStatus.ABERTO_PARA_LANCES },
  });
  const bidderUsers = await prisma.user.findMany({
    where: { id: { in: Object.values(entityStore.users) } },
  });

  if (openLots.length === 0 || bidderUsers.length < 2) {
    log('Not enough open lots or bidders to seed interactions.', 1);
    return;
  }

  // 8.1. Auction Habilitation
  log('Seeding Auction Habilitations...', 1);
  for (const lot of openLots.slice(0, 3)) {
    const auction = await prisma.auction.findUnique({ where: { id: lot.auctionId } });
    if (!auction) continue;
    
    for (let i = 0; i < 3; i++) {
      const bidder = faker.helpers.arrayElement(bidderUsers);
      await prisma.auctionHabilitation.upsert({
        where: {
          userId_auctionId: { userId: bidder.id, auctionId: auction.id },
        },
        update: {},
        create: {
          userId: bidder.id,
          auctionId: auction.id,
        },
      });
    }
    log(`Habilitations created for auction ${auction.id}`, 2);
  }

  // 8.2. Bids
  log('Seeding Bids...', 1);
  for (const lot of openLots.slice(0, 2)) {
    let currentPrice = Number(lot.initialPrice) || 500;
    for (let i = 0; i < 5; i++) {
      const bidder = faker.helpers.arrayElement(bidderUsers);
      currentPrice += faker.number.int({ min: 100, max: 500 });
      await bidService.placeBid(lot.id, bidder.id, currentPrice, bidder.fullName || 'Bidder');
      log(`Bid placed on lot "${lot.title}" by "${bidder.fullName}" for ${currentPrice}.`, 2);
    }
  }

  // 8.3. UserLotMaxBid (automatic bids)
  log('Seeding Automatic Bids...', 1);
  for (const lot of openLots.slice(0, 2)) {
    const bidder = faker.helpers.arrayElement(bidderUsers);
    await prisma.userLotMaxBid.create({
      data: {
        userId: bidder.id,
        lotId: lot.id,
        maxAmount: faker.number.int({ min: 10000, max: 50000 }),
        isActive: true,
      },
    });
    log(`Automatic bid set for lot "${lot.title}".`, 2);
  }

  // 8.4. Finalize a lot and create a win
  log('Seeding a UserWin...', 1);
  const lotToWin = openLots[0];
  const finalizationResult = await lotService.finalizeLot(lotToWin.id);
  if (finalizationResult.success) {
    log(`Lot "${lotToWin.title}" finalized. ${finalizationResult.message}`, 2);
    const win = await prisma.userWin.findFirst({ where: { lotId: lotToWin.id } });
    if (win) {
      // 8.5. Create Installment Payments for the win
      log('Seeding Installment Payments...', 1);
      await installmentPaymentService.createInstallmentsForWin(win.id, 3);
      log(`3 installments created for win ${win.id}.`, 2);

      // Link installments to lot (many-to-many)
      const installments = await prisma.installmentPayment.findMany({
        where: { userWinId: win.id },
      });
      for (const installment of installments) {
        await prisma.$executeRaw`
          INSERT IGNORE INTO _InstallmentPaymentToLot (A, B) 
          VALUES (${installment.id}, ${lotToWin.id})
        `;
      }
      log('Installment-Lot relationships created.', 2);
    }
  }

  // 8.6. Questions and Reviews
  log('Seeding Questions and Reviews...', 1);
  const reviewedLot = openLots[1];
  const questioner = bidderUsers[0];
  const reviewer = bidderUsers[1];
  
  await lotQuestionService.createQuestion(
    reviewedLot.id,
    questioner.id,
    questioner.fullName || '',
    'Qual o estado dos pneus?'
  );
  log(`Question posted on lot "${reviewedLot.title}".`, 2);
  
  await reviewService.createReview(
    reviewedLot.id,
    reviewer.id,
    reviewer.fullName || '',
    4,
    'Ótimo estado, mas a entrega demorou.'
  );
  log(`Review posted on lot "${reviewedLot.title}".`, 2);

  // 8.7. Notifications
  log('Seeding Notifications...', 1);
  for (let i = 0; i < 5; i++) {
    const user = faker.helpers.arrayElement(bidderUsers);
    await notificationService.createNotification({
      userId: user.id,
      tenantId: entityStore.tenantId,
      message: faker.lorem.sentence(),
      link: `/auctions/${faker.helpers.arrayElement(entityStore.auctions)}`,
    });
  }
  log('5 notifications created.', 2);
}

async function seedMiscData() {
  log('Phase 9: Seeding Miscellaneous Data...', 0);

  // 9.1. Direct Sale Offers
  log('Seeding Direct Sale Offers...', 1);
  const seller = await prisma.seller.findFirst({ where: { id: { in: entityStore.sellers } } });
  if (seller) {
    const offerData = {
      title: 'Oferta Direta: Monitor Dell 24"',
      description: 'Pouco usado, em perfeito estado.',
      offerType: 'BUY_NOW',
      price: 800,
      status: 'ACTIVE',
      sellerId: seller.id,
      categoryId: entityStore.categories['Eletrônicos'].id,
    };
    await directSaleOfferService.createDirectSaleOffer(entityStore.tenantId, offerData);
    log(`Direct Sale Offer "${offerData.title}" created.`, 2);
  }

  // 9.2. Contact Messages
  log('Seeding Contact Messages...', 1);
  for (let i = 0; i < 3; i++) {
    await contactMessageService.createContactMessage({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      subject: 'Parceria Comercial',
      message: faker.lorem.paragraph(),
    });
  }
  log('3 contact messages created.', 2);

  // 9.3. Document Templates
  log('Seeding Document Templates...', 1);
  const templates = [
    {
      name: 'Certificado de Leilão Judicial',
      type: DocumentTemplateType.AUCTION_CERTIFICATE,
      content: '<h1>Certificado</h1><p>Leilão: {{auction.title}}</p>',
    },
    {
      name: 'Termo de Arrematação',
      type: DocumentTemplateType.WINNING_BID_TERM,
      content: '<h1>Termo de Arrematação</h1><p>Lote: {{lot.title}}</p>',
    },
    {
      name: 'Laudo de Avaliação',
      type: DocumentTemplateType.EVALUATION_REPORT,
      content: '<h1>Laudo de Avaliação</h1><p>Bem: {{asset.title}}</p>',
    },
  ];

  for (const template of templates) {
    await documentTemplateService.createDocumentTemplate(template);
    log(`Document template "${template.name}" created.`, 2);
  }

  // 9.4. Platform Settings
  log('Seeding Platform Settings...', 1);
  await prisma.platformSettings.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      tenantId: entityStore.tenantId,
      siteTitle: 'BidExpert - Plataforma de Leilões',
      siteTagline: 'Os melhores leilões em um só lugar',
      searchPaginationType: 'loadMore',
      searchItemsPerPage: 12,
      searchLoadMoreCount: 12,
      showCountdownOnLotDetail: true,
      showCountdownOnCards: true,
      showRelatedLotsOnLotDetail: true,
      relatedLotsCount: 5,
      defaultListItemsPerPage: 10,
      isSetupComplete: true,
      homepageSections: {
        hero: true,
        featuredAuctions: true,
        categories: true,
        upcomingLots: true,
      },
      mentalTriggerSettings: {
        urgencyTimer: true,
        socialProof: true,
        scarcity: true,
      },
      biddingSettings: {
        allowAutoBid: true,
        softCloseEnabled: true,
        softCloseMinutes: 5,
      },
    },
  });
  log('Platform settings configured.', 2);

  // 9.5. Data Sources (for report builder)
  log('Seeding Data Sources...', 1);
  const dataSources = [
    {
      name: 'Leilões',
      modelName: 'Auction',
      fields: ['id', 'title', 'status', 'auctionDate', 'totalLots'],
    },
    {
      name: 'Lotes',
      modelName: 'Lot',
      fields: ['id', 'title', 'price', 'status', 'bidsCount'],
    },
    {
      name: 'Usuários',
      modelName: 'User',
      fields: ['id', 'fullName', 'email', 'habilitationStatus'],
    },
  ];

  for (const ds of dataSources) {
    await prisma.data_sources.upsert({
      where: { modelName: ds.modelName },
      update: {},
      create: ds,
    });
  }
  log('3 data sources created.', 2);

  // 9.6. User Documents
  log('Seeding User Documents...', 1);
  const bidder = await prisma.user.findFirst({
    where: { id: entityStore.users.bidder0 },
  });
  if (bidder && entityStore.documentTypes.length > 0) {
    for (let i = 0; i < 2; i++) {
      const docType = entityStore.documentTypes[i];
      await prisma.userDocument.create({
        data: {
          userId: bidder.id,
          documentTypeId: docType,
          fileName: `documento-${i + 1}.pdf`,
          fileUrl: `https://storage.example.com/docs/documento-${i + 1}.pdf`,
          status: 'APPROVED',
        },
      });
    }
    log(`2 user documents created for ${bidder.email}.`, 2);
  }
}

async function seedReports() {
  log('Phase 10: Seeding Custom Reports...', 0);
  
  const reportDefinitions = [
    {
      name: 'Relatório de Vendas Mensais',
      description: 'Análise de vendas por mês',
      definition: {
        type: 'chart',
        dataSource: 'Lot',
        groupBy: 'createdAt',
        aggregation: 'count',
        chartType: 'bar',
      },
    },
    {
      name: 'Performance de Leiloeiros',
      description: 'Ranking de leiloeiros por faturamento',
      definition: {
        type: 'table',
        dataSource: 'Auctioneer',
        columns: ['name', 'totalAuctions', 'totalRevenue'],
        sortBy: 'totalRevenue',
        sortOrder: 'desc',
      },
    },
  ];

  for (const report of reportDefinitions) {
    await prisma.reports.create({
      data: {
        ...report,
        tenantId: entityStore.tenantId,
      },
    });
    log(`Report "${report.name}" created.`, 1);
  }
}

// --- Main Execution ---

async function main() {
  console.log('Starting comprehensive database seed...');
  console.log('=====================================================\n');
  
  try {
    await seedCoreInfra();
    await seedBaseData();
    await seedParticipants();
    await seedJudicialData();
    await seedMediaLibrary();
    await seedAssets();
    await seedAuctionsAndLots();
    await seedInteractions();
    await seedMiscData();
    await seedReports();
    
    console.log('\n=====================================================');
    console.log('✅ Comprehensive database seed finished successfully!');
    console.log('=====================================================');
    console.log('\nSummary:');
    console.log(`- Tenants: 1`);
    console.log(`- Roles: ${Object.keys(entityStore.roles).length}`);
    console.log(`- Users: ${Object.keys(entityStore.users).length}`);
    console.log(`- Categories: ${Object.keys(entityStore.categories).length}`);
    console.log(`- Auctioneers: ${entityStore.auctioneers.length}`);
    console.log(`- Sellers: ${entityStore.sellers.length}`);
    console.log(`- Assets: ${entityStore.assets.length}`);
    console.log(`- Auctions: ${entityStore.auctions.length}`);
    console.log(`- Lots: ${entityStore.lots.length}`);
    console.log(`- Vehicle Makes: ${Object.keys(entityStore.vehicleMakes).length}`);
    console.log(`- Media Items: ${entityStore.mediaItems.length}`);
    console.log('=====================================================\n');
  } catch (error) {
    console.error('\n❌ An error occurred during the seeding process:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();