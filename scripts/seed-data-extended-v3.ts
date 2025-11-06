/**
 * @file Extended Seed Script (v3.0)
 * @version 3.0
 * @description Populates the database with a significantly larger and more diverse set of data
 *              to cover a wide array of scenarios for the BidExpert application.
 *              This version expands on v2, increasing quantities and complexity.
 *
 * @ai-guidelines
 *   - 1. SCRIPT PHILOSOPHY: This script uses SERVICE classes for creating business entities
 *     to ensure all business logic is applied. Direct database calls (`prisma.create`) are
 *     ONLY used for foundational, non-business data where a fixed ID or bootstrapping is necessary.
 *   - 2. SERVICE LAYER API: All service methods are designed to accept and return IDs as `string`.
 *     The conversion to and from `BigInt` is handled within the repository/service layer.
 *     This script MUST ONLY work with string IDs when interacting with services.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { slugify } from '../src/lib/ui-helpers';
import { Decimal } from '@prisma/client/runtime/library';

// AI-NOTE: Import service classes, NOT server actions.
import { UserService } from '../src/services/user.service';
import { RoleService } from '../src/services/role.service';
import { StateService } from '../src/services/state.service';
import { CityService } from '../src/services/city.service';
import { CourtService } from '../src/services/court.service';
import { JudicialDistrictService } from '../src/services/judicial-district.service';
import { JudicialBranchService } from '../src/services/judicial-branch.service';
import { SellerService } from '../src/services/seller.service';
import { AuctioneerService } from '../src/services/auctioneer.service';
import { CategoryService } from '../src/services/category.service';
import { SubcategoryService } from '../src/services/subcategory.service';
import { JudicialProcessService } from '../src/services/judicial-process.service';
import { AssetService } from '../src/services/asset.service';
import { AuctionService } from '../src/services/auction.service';
import { LotService } from '../src/services/lot.service';
import { AuctionHabilitationService } from '../src/services/auction-habilitation.service';
import { BidService } from '../src/services/bid.service';
import { UserWinService } from '../src/services/user-win.service';
import { InstallmentPaymentService } from '../src/services/installment-payment.service';
import { DocumentTypeService } from '../src/services/document-type.service';
import { UserDocumentService } from '../src/services/user-document.service';
import { MediaItemService } from '../src/services/media-item.service';
import { DirectSaleOfferService } from '../src/services/direct-sale-offer.service';
import { LotQuestionService } from '../src/services/lot-question.service';
import { ReviewService } from '../src/services/review.service';
import { NotificationService } from '../src/services/notification.service';
import { UserLotMaxBidService } from '../src/services/user-lot-max-bid.service';
import { VehicleMakeService } from '../src/services/vehicle-make.service';
import { VehicleModelService } from '../src/services/vehicle-model.service';
import { ContactMessageService } from '../src/services/contact-message.service';
import { DataSourceService } from '../src/services/data-source.service';
import { DocumentTemplateService } from '../src/services/document-template.service';
import { ReportService } from '../src/services/report.service';
import { SubscriberService } from '../src/services/subscriber.service';
import { prisma } from '../src/lib/prisma';
import type { Role, AssetFormData, AuctionStatus, LotStatus } from '../src/types';

// AI-NOTE: Instantiate all required services here.
const services = {
    user: new UserService(),
    role: new RoleService(),
    state: new StateService(),
    city: new CityService(),
    court: new CourtService(),
    judicialDistrict: new JudicialDistrictService(),
    judicialBranch: new JudicialBranchService(),
    seller: new SellerService(),
    auctioneer: new AuctioneerService(),
    category: new CategoryService(),
    subcategory: new SubcategoryService(),
    judicialProcess: new JudicialProcessService(),
    asset: new AssetService(),
    auction: new AuctionService(),
    lot: new LotService(),
    habilitation: new AuctionHabilitationService(),
    bid: new BidService(),
    userWin: new UserWinService(),
    installmentPayment: new InstallmentPaymentService(),
    documentType: new DocumentTypeService(),
    userDocument: new UserDocumentService(),
    mediaItem: new MediaItemService(),
    directSaleOffer: new DirectSaleOfferService(),
    lotQuestion: new LotQuestionService(),
    review: new ReviewService(),
    notification: new NotificationService(),
    userLotMaxBid: new UserLotMaxBidService(),
    vehicleMake: new VehicleMakeService(),
    vehicleModel: new VehicleModelService(),
    contactMessage: new ContactMessageService(),
    dataSource: new DataSourceService(),
    documentTemplate: new DocumentTemplateService(prisma),
    report: new ReportService(),
    subscriber: new SubscriberService(),
};

const essentialRoles = [
  { name: 'Administrator', nameNormalized: 'ADMINISTRATOR', description: 'Acesso total a todas as funcionalidades.', permissions: ['manage_all'] },
  { name: 'Consignor', nameNormalized: 'CONSIGNOR', description: 'Pode gerenciar próprios leilões e lotes.', permissions: [] },
  { name: 'Auction Analyst', nameNormalized: 'AUCTION_ANALYST', description: 'Analisa e aprova habilitações de usuários.', permissions: [] },
  { name: 'Bidder', nameNormalized: 'BIDDER', description: 'Usuário habilitado para dar lances.', permissions: [] },
  { name: 'User', nameNormalized: 'USER', description: 'Usuário padrão com acesso de visualização.', permissions: [] },
  { name: 'Tenant Admin', nameNormalized: 'TENANT_ADMIN', description: 'Administrador de um tenant específico.', permissions: [] },
  { name: 'Financial', nameNormalized: 'FINANCIAL', description: 'Gerencia pagamentos e faturamento.', permissions: [] },
  { name: 'Auctioneer', nameNormalized: 'AUCTIONEER', description: 'Leiloeiro responsável por conduzir leilões.', permissions: [] },
];

const brazilianStates = [
  { name: 'Acre', uf: 'AC' }, { name: 'Alagoas', uf: 'AL' }, { name: 'Amapá', uf: 'AP' },
  { name: 'Amazonas', uf: 'AM' }, { name: 'Bahia', uf: 'BA' }, { name: 'Ceará', uf: 'CE' },
  { name: 'Distrito Federal', uf: 'DF' }, { name: 'Espírito Santo', uf: 'ES' }, { name: 'Goiás', uf: 'GO' },
  { name: 'Maranhão', uf: 'MA' }, { name: 'Mato Grosso', uf: 'MT' }, { name: 'Mato Grosso do Sul', uf: 'MS' },
  { name: 'Minas Gerais', uf: 'MG' }, { name: 'Pará', uf: 'PA' }, { name: 'Paraíba', uf: 'PB' },
  { name: 'Paraná', uf: 'PR' }, { name: 'Pernambuco', uf: 'PE' }, { name: 'Piauí', uf: 'PI' },
  { name: 'Rio de Janeiro', uf: 'RJ' }, { name: 'Rio Grande do Norte', uf: 'RN' },
  { name: 'Rio Grande do Sul', uf: 'RS' }, { name: 'Rondônia', uf: 'RO' }, { name: 'Roraima', uf: 'RR' },
  { name: 'Santa Catarina', uf: 'SC' }, { name: 'São Paulo', uf: 'SP' }, { name: 'Sergipe', uf: 'SE' },
  { name: 'Tocantins', uf: 'TO' }
];

const Constants = {
    USER_COUNT: 25,
    AUCTION_COUNT: 15,
    ASSET_COUNT: 100,
    LOTS_PER_AUCTION_MAX: 10,
    BIDS_PER_LOT_MAX: 15,
};

async function cleanDatabase() {
    console.log("Cleaning database...");

    // Improved cleaning order
    const models = Object.keys(prisma).filter(k => !k.startsWith('_'));
    const orderedModelNames = [
        'Bid', 'UserWin', 'InstallmentPayment', 'UserLotMaxBid', 'AssetsOnLots',
        'LotStagePrice', 'Lot', 'AuctionHabilitation', 'AuctionStage', 'Notification',
        'Review', 'LotQuestion', 'DirectSaleOffer', 'Auction', 'Asset', 'JudicialProcess',
        'Seller', 'Auctioneer', 'Report', 'UserDocument', 'UsersOnRoles', 'UsersOnTenants',
        'User', 'Role', 'Subcategory', 'LotCategory', 'VehicleModel', 'VehicleMake',
        'JudicialBranch', 'JudicialDistrict', 'Court', 'City', 'State',
        'PlatformSettings', 'Tenant', 'MediaItem', 'ContactMessage', 'DataSource',
        'DocumentTemplate', 'Subscriber'
    ];

    for (const modelName of orderedModelNames) {
        try {
            // @ts-ignore
            if (prisma[modelName] && typeof prisma[modelName].deleteMany === 'function') {
                 // @ts-ignore
                await prisma[modelName].deleteMany({});
            }
        } catch (error) {
            console.warn(`Could not clean ${modelName}:`, error.message);
        }
    }

    console.log("Database cleaned.");
}

async function main() {
  console.log(`--- STARTING EXTENDED SEED (V3.0) ---`);
  console.log(`Data Constants: ${JSON.stringify(Constants)}`);
  await cleanDatabase();

  console.log("Seeding foundational data (Roles, Landlord, Settings, States)...");

  const createdRoles: { [key: string]: Role } = {};
  for (const role of essentialRoles) {
    const newRoleResult = await services.role.createRole(role);
    if (!newRoleResult.success || !newRoleResult.roleId) throw new Error(newRoleResult.message);
    const roleRecord = await services.role.getRoleById(newRoleResult.roleId);
    if (!roleRecord) throw new Error("Failed to fetch created role");
    createdRoles[role.nameNormalized] = roleRecord;
  }

  const landlordTenant = await prisma.tenant.upsert({
    where: { id: 1n },
    update: { },
    create: { id: 1n, name: 'Landlord', subdomain: 'www', domain: 'bidexpert.com.br' },
  });
  const tenantId = landlordTenant.id.toString();

  await prisma.platformSettings.upsert({
    where: { tenantId: BigInt(tenantId) },
    update: {},
    create: { tenantId: BigInt(tenantId), siteTitle: 'BidExpert', siteTagline: 'Sua plataforma de leilões online.', isSetupComplete: true },
  });

  const createdStates: { [key: string]: any } = {};
  for (const state of brazilianStates) {
    const newStateResult = await services.state.createState({ ...state });
    if (!newStateResult.success || !newStateResult.stateId) throw new Error(newStateResult.message);
    const newState = await services.state.getStateById(newStateResult.stateId);
    createdStates[state.uf] = newState;
  }
  console.log("Foundational data seeded.");

  console.log("Creating users...");
  const adminUserResult = await services.user.createUser({
    email: 'admin@bidexpert.com.br',
    fullName: 'Administrador',
    password: 'Admin@123',
    habilitationStatus: 'HABILITADO',
    accountType: 'LEGAL',
    roleIds: [createdRoles['ADMINISTRATOR'].id],
    tenantId: tenantId,
  });
  if (!adminUserResult.success || !adminUserResult.userId) throw new Error(adminUserResult.message);
  const adminUser = await services.user.getUserById(adminUserResult.userId);

  const auctioneerUsers = [];
  for (let i = 0; i < 3; i++) {
      const userResult = await services.user.createUser({
          email: `leilo${i}@bidexpert.com.br`,
          fullName: faker.person.fullName(),
          password: 'Admin@123',
          habilitationStatus: 'HABILITADO',
          roleIds: [createdRoles['AUCTIONEER'].id],
          tenantId: tenantId,
      });
      if (!userResult.success || !userResult.userId) throw new Error(userResult.message);
      auctioneerUsers.push(await services.user.getUserById(userResult.userId));
  }

  const sellerUsers = [];
    for (let i = 0; i < 5; i++) {
        const userResult = await services.user.createUser({
            email: `comit${i}@bidexpert.com.br`,
            fullName: faker.person.fullName(),
            password: 'Admin@123',
            habilitationStatus: 'HABILITADO',
            roleIds: [createdRoles['CONSIGNOR'].id],
            tenantId: tenantId,
        });
        if (!userResult.success || !userResult.userId) throw new Error(userResult.message);
        sellerUsers.push(await services.user.getUserById(userResult.userId));
    }


  const bidderUsers = [];
  for (let i = 0; i < Constants.USER_COUNT; i++) {
    const userResult = await services.user.createUser({
      email: faker.internet.email(),
      fullName: faker.person.fullName(),
      password: 'Admin@123',
      habilitationStatus: i % 5 === 0 ? 'PENDING_DOCUMENTS' : 'HABILITADO',
      roleIds: [createdRoles['BIDDER'].id],
      tenantId: tenantId,
    });
    if (!userResult.success || !userResult.userId) throw new Error(userResult.message);
    bidderUsers.push(await services.user.getUserById(userResult.userId));
  }
  console.log(`${Constants.USER_COUNT} bidder users created.`);

  console.log("Creating business entities (Cities, Courts, Sellers, etc.)...");
  const cities = [];
  const citySPResult = await services.city.createCity({ name: 'São Paulo', stateId: createdStates['SP'].id, ibgeCode: '3550308' });
  if(!citySPResult.success || !citySPResult.cityId) throw new Error(citySPResult.message);
  cities.push(await services.city.getCityById(citySPResult.cityId));

  const cityRJResult = await services.city.createCity({ name: 'Rio de Janeiro', stateId: createdStates['RJ'].id, ibgeCode: '3304557' });
   if(!cityRJResult.success || !cityRJResult.cityId) throw new Error(cityRJResult.message);
  cities.push(await services.city.getCityById(cityRJResult.cityId));

  const auctioneers = [];
  for(let i = 0; i < auctioneerUsers.length; i++) {
      const result = await services.auctioneer.createAuctioneer(tenantId, {
        name: `Leiloeiro Oficial ${i + 1}`,
        registrationNumber: `JUCESP-${faker.string.numeric(5)}`,
        userId: auctioneerUsers[i]!.id,
        city: faker.location.city(), website: faker.internet.domainName(), zipCode: faker.location.zipCode(), contactName: faker.person.fullName(), phone: faker.phone.number(), email: faker.internet.email(), address: faker.location.streetAddress(), state: 'SP',
        description: 'Leiloeiro com anos de experiência.', logoUrl: null, logoMediaId: null, dataAiHintLogo: null,
      });
      if(!result.success || !result.auctioneerId) throw new Error(result.message);
      auctioneers.push(await services.auctioneer.getAuctioneerById(tenantId, result.auctioneerId));
  }

  const sellers = [];
  for(let i = 0; i < sellerUsers.length; i++) {
      const result = await services.seller.createSeller(tenantId, {
        name: `Vendedor Particular ${i + 1}`,
        isJudicial: false,
        userId: sellerUsers[i]!.id,
        city: faker.location.city(), website: faker.internet.domainName(), zipCode: faker.location.zipCode(), contactName: faker.person.fullName(), phone: faker.phone.number(), email: faker.internet.email(), address: faker.location.streetAddress(),
        state: 'SP', description: 'Vendedor de ativos diversos.', logoUrl: null, logoMediaId: null, dataAiHintLogo: null,
      });
      if(!result.success || !result.sellerId) throw new Error(result.message);
      sellers.push(await services.seller.getSellerById(tenantId, result.sellerId));
  }

  const catImoveisResult = await services.category.createCategory({ name: 'Imóveis', description: 'Imóveis em geral' });
  if(!catImoveisResult.success || !catImoveisResult.category) throw new Error(catImoveisResult.message);
  const catImoveis = catImoveisResult.category;

  const catVeiculosResult = await services.category.createCategory({ name: 'Veículos', description: 'Veículos automotores' });
  if(!catVeiculosResult.success || !catVeiculosResult.category) throw new Error(catVeiculosResult.message);
  const catVeiculos = catVeiculosResult.category;

  const catEletronicosResult = await services.category.createCategory({ name: 'Eletrônicos', description: 'Equipamentos eletrônicos' });
  if(!catEletronicosResult.success || !catEletronicosResult.category) throw new Error(catEletronicosResult.message);
  const catEletronicos = catEletronicosResult.category;

  await services.subcategory.createSubcategory({ name: 'Apartamentos', parentCategoryId: catImoveis.id, description: 'Apartamentos', displayOrder: 0, iconUrl: '', iconMediaId: null, dataAiHintIcon: '' });
  await services.subcategory.createSubcategory({ name: 'Casas', parentCategoryId: catImoveis.id, description: 'Casas', displayOrder: 1, iconUrl: '', iconMediaId: null, dataAiHintIcon: '' });
  await services.subcategory.createSubcategory({ name: 'Carros', parentCategoryId: catVeiculos.id, description: 'Carros', displayOrder: 0, iconUrl: '', iconMediaId: null, dataAiHintIcon: '' });
  await services.subcategory.createSubcategory({ name: 'Motos', parentCategoryId: catVeiculos.id, description: 'Motos', displayOrder: 1, iconUrl: '', iconMediaId: null, dataAiHintIcon: '' });
  await services.subcategory.createSubcategory({ name: 'Celulares', parentCategoryId: catEletronicos.id, description: 'Celulares', displayOrder: 0, iconUrl: '', iconMediaId: null, dataAiHintIcon: '' });


  console.log("Creating assets...");
  const assets = [];
  for (let i = 0; i < Constants.ASSET_COUNT; i++) {
      const category = faker.helpers.arrayElement([catImoveis, catVeiculos, catEletronicos]);
      const seller = faker.helpers.arrayElement(sellers);
      const city = faker.helpers.arrayElement(cities);

      let assetData: Partial<AssetFormData> = {
          title: '',
          description: faker.lorem.paragraph(),
          categoryId: category.id,
          evaluationValue: faker.number.int({ min: 1000, max: 500000 }),
          sellerId: seller!.id,
          locationCity: city!.name,
          locationState: city!.state.uf,
          status: 'DISPONIVEL',
      };

      if (category.id === catVeiculos.id) {
          assetData.title = `Veículo ${faker.vehicle.manufacturer()} ${faker.vehicle.model()}`;
          assetData.make = faker.vehicle.manufacturer();
          assetData.model = faker.vehicle.model();
          assetData.year = faker.date.past({ years: 10 }).getFullYear();
          assetData.modelYear = assetData.year;
      } else if (category.id === catImoveis.id) {
          assetData.title = `Imóvel em ${city!.name} - ${faker.location.streetAddress(false)}`;
      } else {
          assetData.title = `Eletrônico: ${faker.commerce.productName()}`;
      }

      const assetResult = await services.asset.createAsset(tenantId, assetData as AssetFormData);
      if (!assetResult.success || !assetResult.assetId) {
          console.warn(`Failed to create asset: ${assetResult.message}`);
          continue;
      }
      assets.push(await services.asset.getAssetById(tenantId, assetResult.assetId));
  }
  console.log(`${assets.length} assets created.`);


  console.log("Creating auctions and lots...");
  const auctions = [];
  let availableAssets = faker.helpers.shuffle(assets.filter(a => a?.status === 'DISPONIVEL'));

  for (let i = 0; i < Constants.AUCTION_COUNT; i++) {
      const auctioneer = faker.helpers.arrayElement(auctioneers);
      const seller = faker.helpers.arrayElement(sellers);
      const status = faker.helpers.arrayElement<AuctionStatus>(['ABERTO_PARA_LANCES', 'EM_BREVE', 'FINALIZADO', 'CANCELADO']);

      const auctionResult = await services.auction.createAuction(tenantId, {
          title: `Grande Leilão de ${seller!.name} - #${i + 1}`,
          auctionType: 'EXTRAJUDICIAL',
          status: status,
          auctioneerId: auctioneer!.id,
          sellerId: seller!.id,
          auctionDate: faker.date.future(),
          softCloseEnabled: i % 2 === 0, // Enable soft close for half of the auctions
      });
      if (!auctionResult.success || !auctionResult.auctionId) {
          console.warn(`Failed to create auction: ${auctionResult.message}`);
          continue;
      }
      const auction = await services.auction.getAuctionById(tenantId, auctionResult.auctionId);
      auctions.push(auction);

      // Create lots for this auction
      const numLots = faker.number.int({ min: 1, max: Constants.LOTS_PER_AUCTION_MAX });
      for (let j = 0; j < numLots; j++) {
          if (availableAssets.length === 0) continue;

          const asset = availableAssets.pop(); // Take the next available asset
          if (!asset) continue;

          const lotResult = await services.lot.createLot({
              auctionId: auction!.id,
              title: `Lote ${j + 1} - ${asset.title}`,
              number: `${j + 1}`.padStart(3, '0'),
              price: asset.evaluationValue as number,
              assetIds: [asset.id],
              type: 'EXTRAJUDICIAL',
          }, tenantId, adminUser!.id);

          if (lotResult.success && lotResult.lotId) {
              // Mark asset as part of a lot
              await services.asset.updateAsset(tenantId, asset.id, { status: 'EM_LOTE' });
          } else {
              console.warn(`Failed to create lot: ${lotResult.message}`);
          }
      }
  }
  console.log(`${auctions.length} auctions created with lots.`);


  console.log("Simulating bids, wins, and user interactions...");
  const openAuctions = await prisma.auction.findMany({ where: { status: 'ABERTO_PARA_LANCES' } });

  for (const auction of openAuctions) {
      const lots = await prisma.lot.findMany({ where: { auctionId: auction.id } });
      const habilitatedBidders = bidderUsers.filter(u => u?.habilitationStatus === 'HABILITADO');

      for (const lot of lots) {
          const numBids = faker.number.int({ min: 0, max: Constants.BIDS_PER_LOT_MAX });
          let lastBidAmount = new Decimal(lot.price || 0);

          for (let i = 0; i < numBids; i++) {
              const bidder = faker.helpers.arrayElement(habilitatedBidders);
              if (!bidder) continue;

              lastBidAmount = lastBidAmount.plus(new Decimal(lot.bidIncrementStep || 100));
              await services.bid.createBid({
                  lot: { connect: { id: lot.id } },
                  bidder: { connect: { id: BigInt(bidder.id) } },
                  amount: lastBidAmount,
                  auction: { connect: { id: auction.id } },
                  tenant: { connect: { id: BigInt(tenantId) } }
              });
          }

          // Simulate a win
          if (numBids > 0) {
              const winningBid = await prisma.bid.findFirst({ where: { lotId: lot.id }, orderBy: { amount: 'desc' } });
              if (winningBid) {
                  const userWin = await services.userWin.create({
                      lot: { connect: { id: lot.id } },
                      user: { connect: { id: winningBid.bidderId } },
                      winningBidAmount: winningBid.amount,
                      paymentStatus: 'PENDENTE',
                  });
                  if (userWin) {
                      await services.installmentPayment.createInstallmentsForWin(userWin, faker.helpers.arrayElement([1, 3, 6]));
                  }
                  await prisma.lot.update({ where: { id: lot.id }, data: { status: 'VENDIDO', winnerId: winningBid.bidderId.toString() } });
              }
          } else {
               await prisma.lot.update({ where: { id: lot.id }, data: { status: 'NAO_VENDIDO' } });
          }
      }
  }
  console.log("Bidding and win simulation complete.");


  console.log("--- SEED SCRIPT V3.0 FINISHED SUCCESSFULLY ---");
}

main()
  .catch((e) => {
    console.error("--- SEED SCRIPT V3.0 FAILED ---");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });