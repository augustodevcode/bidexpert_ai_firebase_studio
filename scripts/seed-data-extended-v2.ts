/**
 * @file Extended Seed Script (v2)
 * @version 2.0
 * @description Populates the database with a comprehensive and interconnected set of data
 *              that covers all major scenarios of the BidExpert application.
 * 
 * @ai-guidelines
 *   - 1. SCRIPT PHILOSOPHY: This script uses SERVICE classes for creating business entities
 *     (Auctions, Lots, Users, etc.) to ensure all business logic is applied. Direct
 *     database calls (`prisma.create`) are ONLY used for foundational, non-business
 *     data like Roles, the Landlord Tenant, and global settings where a fixed ID or
 *     bootstrapping is necessary.
 * 
 *   - 2. WHY NOT ACTIONS: Server Actions (`.../actions.ts`) are NOT used because they
 *     import `server-only`, which causes this script (running in a standard Node.js
 *     environment) to fail. The services contain the core logic, so using them is the
 *     correct approach here.
 * 
 *   - 3. FIXED TENANT ID: The Landlord Tenant is intentionally created with `id: 1`.
 *     All other entities created in this script that have a `tenantId` foreign key
 *     MUST be associated with this ID.
 * 
 *   - 4. ADDING NEW ENTITIES: To add a new entity, first check if a service exists in
 *     `../src/services/`. If so, import it, instantiate it, and use its `create` or
 *     `update` method. Follow the existing patterns in the `seed...` functions below.
 * 
 *   - 5. DATABASE CLEANING: The `cleanDatabase` function at the beginning is critical.
 *     If you add a new model to the schema with relations, you MUST add its table to this list in the correct reverse dependency order.
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { hash } from 'bcryptjs';
import { slugify } from '../src/lib/ui-helpers';

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

const prisma = new PrismaClient();

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
  { name: 'Administrator', nameNormalized: 'ADMINISTRATOR', description: 'Acesso total a todas as funcionalidades.', permissions: [] },
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

/**
 * AI-NOTE: This function is critical. It deletes all data in the correct order to avoid
 * foreign key constraint errors. If you add a new model to the schema with relations,
 * you MUST add its table to this list in the correct reverse dependency order.
 */
async function cleanDatabase() {
    console.log("Cleaning database...");
    const modelNames = [
      '_InstallmentPaymentToLot', '_AuctionToLotCategory', '_AuctionToJudicialDistrict', '_AuctionToJudicialBranch', '_AuctionToCourt',
      'InstallmentPayment', 'UserWin', 'Bid', 'UserLotMaxBid', 'AssetsOnLots', 'Review', 'LotQuestion', 'Notification', 'Lot',
      'AuctionHabilitation', 'AuctionStage', 'Auction', 'Asset', 'MediaItem', 'JudicialParty', 'JudicialProcess', 'DirectSaleOffer',
      'Seller', 'Auctioneer', 'UsersOnRoles', 'UsersOnTenants', 'UserDocument', 'Report', 'User', 'PlatformSettings', 'Tenant',
      'Role', 'Subcategory', 'LotCategory', 'JudicialBranch', 'JudicialDistrict', 'Court', 'City', 'State', 'DocumentType',
      'DocumentTemplate', 'ContactMessage', 'DataSource', 'Subscriber', 'VehicleModel', 'VehicleMake'
    ];
    for (const modelName of modelNames) {
        if ((prisma as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)]) {
            await (prisma as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)].deleteMany({});
        }
    }
    console.log("Database cleaned.");
}

async function main() {
  console.log("--- STARTING EXTENDED SEED (V2) ---");
  await cleanDatabase();

  // --- 2. Seed Foundational Data ---
  console.log("Seeding foundational data (Roles, Landlord, Settings, States)...");

  // AI-NOTE: Roles are foundational and created first.
  const createdRoles: { [key: string]: any } = {};
  for (const role of essentialRoles) {
    const newRoleResult = await services.role.createRole(role);
    if (!newRoleResult.success) throw new Error(newRoleResult.message);
    createdRoles[role.nameNormalized] = { id: newRoleResult.roleId!.toString() };
  }

  // AI-NOTE: Direct `prisma` call is necessary here to guarantee the Landlord Tenant has id: 1.
  const landlordTenant = await prisma.tenant.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Landlord', subdomain: 'www', domain: 'bidexpert.com.br' },
  });
  const tenantId = landlordTenant.id.toString();

  // AI-NOTE: Platform settings are also foundational and tightly coupled with the tenant.
  const platformSettings = await prisma.platformSettings.upsert({
    where: { tenantId },
    update: {},
    create: { tenantId, siteTitle: 'BidExpert', siteTagline: 'Sua plataforma de leilões online.', isSetupComplete: true },
  });
  await prisma.mapSettings.upsert({ where: { platformSettingsId: platformSettings.id }, update: {}, create: { platformSettingsId: platformSettings.id } });
  await prisma.biddingSettings.upsert({ where: { platformSettingsId: platformSettings.id }, update: {}, create: { platformSettingsId: platformSettings.id } });
  await prisma.paymentGatewaySettings.upsert({ where: { platformSettingsId: platformSettings.id }, update: {}, create: { platformSettingsId: platformSettings.id } });
  await prisma.notificationSettings.upsert({ where: { platformSettingsId: platformSettings.id }, update: {}, create: { platformSettingsId: platformSettings.id } });
  await prisma.mentalTriggerSettings.upsert({ where: { platformSettingsId: platformSettings.id }, update: {}, create: { platformSettingsId: platformSettings.id } });
  await prisma.sectionBadgeVisibility.upsert({ where: { platformSettingsId: platformSettings.id }, update: {}, create: { platformSettingsId: platformSettings.id, searchGrid: {}, lotDetail: {} } });

  const createdStates: { [key: string]: any } = {};
  for (const state of brazilianStates) {
    const newStateResult = await services.state.createState({ ...state });
    if (!newStateResult.success) throw new Error(newStateResult.message);
    const newState = await services.state.getStateById(newStateResult.stateId!);
    createdStates[state.uf] = newState;
  }
  console.log("Foundational data seeded.");

  // --- 3. Create Users ---
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
  if (!adminUserResult.success) throw new Error(adminUserResult.message);
  const adminUser = await services.user.getUserById(adminUserResult.userId!)

  const auctioneerUserResult = await services.user.createUser({
    email: 'leilo@bidexpert.com.br',
    fullName: 'Leiloeiro de Teste',
    password: 'Admin@123',
    habilitationStatus: 'HABILITADO',
    roleIds: [createdRoles['AUCTIONEER'].id],
    tenantId: tenantId,
  });
  if (!auctioneerUserResult.success) throw new Error(auctioneerUserResult.message);
  const auctioneerUser = await services.user.getUserById(auctioneerUserResult.userId!)


  const sellerUserResult = await services.user.createUser({
    email: 'comit@bidexpert.com.br',
    fullName: 'Comitente de Teste',
    password: 'Admin@123',
    habilitationStatus: 'HABILITADO',
    roleIds: [createdRoles['CONSIGNOR'].id],
    tenantId: tenantId,
  });
  if (!sellerUserResult.success) throw new Error(sellerUserResult.message);
  const sellerUser = await services.user.getUserById(sellerUserResult.userId!)


  const bidderUsers = [];
  for (let i = 0; i < 5; i++) {
    const userResult = await services.user.createUser({
      email: faker.internet.email(),
      fullName: faker.person.fullName(),
      password: 'Admin@123',
      habilitationStatus: 'HABILITADO',
      roleIds: [createdRoles['BIDDER'].id],
      tenantId: tenantId,
    });
    if (!userResult.success) throw new Error(userResult.message);
    const user = await services.user.getUserById(userResult.userId!)
    bidderUsers.push(user);
  }
  console.log("Users created.");

  // --- 4. Create Business Entities ---
  console.log("Creating business entities (Sellers, Auctioneers, Categories, etc.)...");
  const stateSP = createdStates['SP'];
  if(!stateSP) throw new Error("State SP not found");

  const citySPResult = await services.city.createCity({ name: 'São Paulo', stateId: stateSP.id.toString(), ibgeCode: '3550308' });
  if(!citySPResult.success) throw new Error(citySPResult.message);
  const citySP = await services.city.getCityById(citySPResult.cityId!)

  const courtTJSPResult = await services.court.createCourt({ name: 'Tribunal de Justiça de São Paulo', stateUf: 'SP' });
  if(!courtTJSPResult.success) throw new Error(courtTJSPResult.message);
  const courtTJSP = await services.court.getCourtById(courtTJSPResult.courtId!)

  const districtSPResult = await services.judicialDistrict.createJudicialDistrict({ name: 'Comarca de São Paulo', courtId: courtTJSP.id.toString(), stateId: stateSP.id.toString() });
  if(!districtSPResult.success) throw new Error(districtSPResult.message);
  const districtSP = await services.judicialDistrict.getJudicialDistrictById(districtSPResult.districtId!)

  const branchCivilResult = await services.judicialBranch.createJudicialBranch({ name: '1ª Vara Cível', districtId: districtSP.id.toString() });
  if(!branchCivilResult.success) throw new Error(branchCivilResult.message);
  const branchCivil = await services.judicialBranch.getJudicialBranchById(branchCivilResult.branchId!)

  const mainAuctioneerResult = await services.auctioneer.createAuctioneer(tenantId.toString(), {
    name: 'Leiloeiro Oficial & Associados',
    registrationNumber: 'JUCESP-123',
    userId: auctioneerUser!.id.toString(),
  });
  if(!mainAuctioneerResult.success) throw new Error(mainAuctioneerResult.message);
  const mainAuctioneer = await services.auctioneer.getAuctioneerById(tenantId.toString(), mainAuctioneerResult.auctioneerId!)

  const judicialSellerResult = await services.seller.createSeller(tenantId.toString(), {
    name: '1ª Vara Cível de São Paulo',
    isJudicial: true,
    judicialBranchId: branchCivil!.id.toString(),
  });
  if(!judicialSellerResult.success) throw new Error(judicialSellerResult.message);
  const judicialSeller = await services.seller.getSellerById(tenantId.toString(), judicialSellerResult.sellerId!)

  const extrajudicialSellerResult = await services.seller.createSeller(tenantId.toString(), {
    name: 'Banco Vende Tudo S/A',
    isJudicial: false,
    userId: sellerUser!.id.toString(),
  });
  if(!extrajudicialSellerResult.success) throw new Error(extrajudicialSellerResult.message);
  const extrajudicialSeller = await services.seller.getSellerById(tenantId.toString(), extrajudicialSellerResult.sellerId!)

  const catImoveisResult = await services.category.createCategory({ name: 'Imóveis' });
  if(!catImoveisResult.success) throw new Error(catImoveisResult.message);
  const catImoveis = catImoveisResult.category

  const catVeiculosResult = await services.category.createCategory({ name: 'Veículos' });
  if(!catVeiculosResult.success) throw new Error(catVeiculosResult.message);
  const catVeiculos = catVeiculosResult.category

  await services.subcategory.createSubcategory({ name: 'Apartamentos', parentCategoryId: catImoveis.id.toString() });
  await services.subcategory.createSubcategory({ name: 'Carros', parentCategoryId: catVeiculos.id.toString() });

  const judicialProcessResult = await services.judicialProcess.createJudicialProcess(tenantId.toString(), {
            processNumber: '0012345-67.2024.8.26.0001',
            isElectronic: true,
            parties: [],
            courtId: courtTJSP.id.toString(),
            districtId: districtSP.id.toString(),
            branchId: branchCivil.id.toString(),
            sellerId: judicialSeller.id.toString(),      });
      if(!judicialProcessResult.success) throw new Error(judicialProcessResult.message);
      const judicialProcess = await services.judicialProcess.getJudicialProcessById(tenantId.toString(), judicialProcessResult.processId!)
    
        const assetApartmentResult = await services.asset.createAsset(tenantId.toString(), {
          title: 'Apartamento em Moema, 2 dorms',
          description: 'Lindo apartamento com vista para o parque.',
          categoryId: catImoveis.id.toString(),
          evaluationValue: 750000.00,
          judicialProcessId: judicialProcess.id.toString(),
          sellerId: judicialSeller.id.toString(),
          locationCity: 'São Paulo',
          locationState: 'SP',
          status: 'DISPONIVEL',
          address: 'Rua da Amostra, 123',
          latitude: -23.59000000,
          longitude: -46.67000000,
        });      if(!assetApartmentResult.success) throw new Error(assetApartmentResult.message);
      const assetApartment = await services.asset.getAssetById(tenantId.toString(), assetApartmentResult.assetId!)
    
        const assetCarResult = await services.asset.createAsset(tenantId.toString(), {
          title: 'Ford Ka 2019',
          description: 'Carro em ótimo estado, único dono.',
          categoryId: catVeiculos.id.toString(),
          evaluationValue: 45000.00,
          sellerId: extrajudicialSeller.id.toString(),
          locationCity: 'São Paulo',
          locationState: 'SP',
          status: 'DISPONIVEL',
          make: 'Ford',
          model: 'Ka',
          year: 2019,
          modelYear: 2019,
        });      if(!assetCarResult.success) throw new Error(assetCarResult.message);
      const assetCar = await services.asset.getAssetById(tenantId.toString(), assetCarResult.assetId!)
    
      const judicialAuctionResult = await services.auction.createAuction(tenantId.toString(), {
        title: 'Leilão Judicial de Imóveis - TJSP',
        auctionType: 'JUDICIAL',
        status: 'ABERTO_PARA_LANCES',
        auctioneerId: mainAuctioneer.id.toString(),
        sellerId: judicialSeller.id.toString(),
        auctionDate: faker.date.future(),
      });
      if(!judicialAuctionResult.success) throw new Error(judicialAuctionResult.message);
      const judicialAuction = await services.auction.getAuctionById(tenantId.toString(), judicialAuctionResult.auctionId!)
    
      const extrajudicialAuctionResult = await services.auction.createAuction(tenantId.toString(), {
        title: 'Leilão de Veículos do Banco Vende Tudo',
        auctionType: 'EXTRAJUDICIAL',
        status: 'ABERTO_PARA_LANCES',
        auctioneerId: mainAuctioneer.id.toString(),
        sellerId: extrajudicialSeller.id.toString(),
        auctionDate: faker.date.future(),
      });
      if(!extrajudicialAuctionResult.success) throw new Error(extrajudicialAuctionResult.message);
      const extrajudicialAuction = await services.auction.getAuctionById(tenantId.toString(), extrajudicialAuctionResult.auctionId!)
    
      const lotApartmentResult = await services.lot.createLot({
        auctionId: judicialAuction.id.toString(),
        title: 'Lote 001 - Apartamento em Moema',
        number: '001',
        price: 750000.00,
        assetIds: [assetApartment.id.toString()],
        type: 'IMOVEL'
      }, tenantId.toString());
      if(!lotApartmentResult.success) throw new Error(lotApartmentResult.message);
      const lotApartment = await services.lot.getLotById(lotApartmentResult.lotId!)
    
      const lotCarResult = await services.lot.createLot({
        auctionId: extrajudicialAuction.id.toString(),
        title: 'Lote 001 - Ford Ka 2019',
        number: '001',
        price: 45000.00,
        assetIds: [assetCar.id.toString()],
        type: 'VEICULO'
      }, tenantId.toString());
      if(!lotCarResult.success) throw new Error(lotCarResult.message);
      const lotCar = await services.lot.getLotById(lotCarResult.lotId!)
    
      for (const user of bidderUsers) {
        await services.habilitation.upsertAuctionHabilitation({
            user: { connect: { id: user.id.toString() } },
            auction: { connect: { id: judicialAuction.id.toString() } }
        });
        await services.habilitation.upsertAuctionHabilitation({
            user: { connect: { id: user.id.toString() } },
            auction: { connect: { id: extrajudicialAuction.id.toString() } }
        });
      }
    
      await services.bid.createBid({ lot: { connect: { id: lotCar.id.toString() } }, bidder: { connect: { id: bidderUsers[0].id.toString() } }, amount: 46000.00, auction: { connect: { id: extrajudicialAuction.id.toString() } }, tenant: { connect: { id: tenantId } } });
      await services.bid.createBid({ lot: { connect: { id: lotCar.id.toString() } }, bidder: { connect: { id: bidderUsers[1].id.toString() } }, amount: 47000.00, auction: { connect: { id: extrajudicialAuction.id.toString() } }, tenant: { connect: { id: tenantId } } });
      await services.bid.createBid({ lot: { connect: { id: lotApartment.id.toString() } }, bidder: { connect: { id: bidderUsers[2].id.toString() } }, amount: 755000.00, auction: { connect: { id: judicialAuction.id.toString() } }, tenant: { connect: { id: tenantId } } });
    
      const winningBid = await prisma.bid.findFirst({ where: { lotId: lotCar.id.toString() }, orderBy: { amount: 'desc' } });
      if (winningBid) {
        const userWin = await services.userWin.create({
          lot: { connect: { id: lotCar.id.toString() } },
          user: { connect: { id: winningBid.bidderId.toString() } },
          winningBidAmount: winningBid.amount,
          paymentStatus: 'PENDENTE',
        });
    await services.installmentPayment.createInstallmentsForWin(userWin, 3);
  }

  // --- Seed Document Types ---
  console.log("Seeding Document Types...");
  const docTypeRGResult = await services.documentType.upsertDocumentType({ name: 'RG', description: 'Documento de Identidade', isRequired: true, appliesTo: 'PHYSICAL' });
  if (!docTypeRGResult) throw new Error("Failed to upsert RG DocumentType");
  const docTypeRG = docTypeRGResult;

  const docTypeCPFResult = await services.documentType.upsertDocumentType({ name: 'CPF', description: 'Cadastro de Pessoa Física', isRequired: true, appliesTo: 'PHYSICAL' });
  if (!docTypeCPFResult) throw new Error("Failed to upsert CPF DocumentType");
  const docTypeCPF = docTypeCPFResult;

  // --- Seed User Documents ---
  console.log("Seeding User Documents...");
  const adminRGDocResult = await services.userDocument.createUserDocument({
    userId: adminUser.id.toString(),
    documentTypeId: docTypeRG.id.toString(),
    fileUrl: faker.image.url(),
    fileName: 'rg_admin.pdf',
    status: 'APPROVED',
  });
  if (!adminRGDocResult.success) throw new Error(adminRGDocResult.message);

  const adminCPFDocResult = await services.userDocument.createUserDocument({
    userId: adminUser.id.toString(),
    documentTypeId: docTypeCPF.id.toString(),
    fileUrl: faker.image.url(),
    fileName: 'cpf_admin.pdf',
    status: 'APPROVED',
  });
  if (!adminCPFDocResult.success) throw new Error(adminCPFDocResult.message);

  // --- Seed Media Items ---
  console.log("Seeding Media Items...");
  const mediaItem1Result = await services.mediaItem.createMediaItem({
    fileName: 'apartment_image.jpg',
    mimeType: 'image/jpeg',
    storagePath: '/uploads/apartment_image.jpg',
    urlOriginal: faker.image.url(),
    title: 'Apartamento Moema',
    uploadedByUserId: adminUser?.id.toString(),
  });
  if (!mediaItem1Result.success) throw new Error(mediaItem1Result.message);
  const mediaItem1 = mediaItem1Result.mediaItem;

  const mediaItem2Result = await services.mediaItem.createMediaItem({
    fileName: 'car_image.jpg',
    mimeType: 'image/jpeg',
    storagePath: '/uploads/car_image.jpg',
    urlOriginal: faker.image.url(),
    title: 'Ford Ka',
    uploadedByUserId: adminUser?.id.toString(),
  });
  if (!mediaItem2Result.success) throw new Error(mediaItem2Result.message);
  const mediaItem2 = mediaItem2Result.mediaItem;

  // --- Seed Vehicle Makes and Models ---
  console.log("Seeding Vehicle Makes and Models...");
  const makeFordResult = await services.vehicleMake.createVehicleMake({ name: 'Ford', slug: 'ford' });
  if (!makeFordResult.success) throw new Error(makeFordResult.message);
  const makeFord = { id: makeFordResult.makeId! };

  const modelKaResult = await services.vehicleModel.createVehicleModel({ name: 'Ka', slug: 'ka', makeId: makeFord.id.toString() });
  if (!modelKaResult.success) throw new Error(modelKaResult.message);
  const modelKa = { id: modelKaResult.modelId! };

  // --- Seed Direct Sale Offer ---
  console.log("Seeding Direct Sale Offer...");
  const directSaleOfferResult = await services.directSaleOffer.createDirectSaleOffer(tenantId.toString(), {
    title: 'Venda Direta: Terreno em Atibaia',
    description: 'Ótimo terreno para construção de casa de campo.',
    offerType: 'BUY_NOW',
    price: 250000.00,
    status: 'ACTIVE',
    sellerId: extrajudicialSeller.id.toString(),
    categoryId: catImoveis.id.toString(),
    imageMediaId: mediaItem1.id.toString(),
    locationCity: 'Atibaia',
    locationState: 'SP',
  });
  if (!directSaleOfferResult.success) throw new Error(directSaleOfferResult.message);

  // --- Seed Lot Questions ---
  console.log("Seeding Lot Questions...");
  await services.lotQuestion.create({
    lotId: lotApartment.id.toString(),
    auctionId: judicialAuction.id.toString(),
    userId: bidderUsers[0]?.id.toString()!,
    questionText: 'Qual o valor do condomínio?',
    userDisplayName: bidderUsers[0]?.fullName!,
  });
  await services.lotQuestion.create({
    lotId: lotApartment.id.toString(),
    auctionId: judicialAuction.id.toString(),
    userId: adminUser?.id.toString()!,
    questionText: 'O imóvel possui dívidas de IPTU?',
    userDisplayName: adminUser?.fullName!,
    answerText: 'Não, todas as dívidas estão quitadas.',
    answeredByUserId: adminUser?.id.toString()!,
    answeredByUserDisplayName: adminUser?.fullName!,
  });

  // --- Seed Reviews ---
  console.log("Seeding Reviews...");
  await services.review.create({
    lotId: lotCar.id.toString(),
    auctionId: extrajudicialAuction.id.toString(),
    userId: bidderUsers[1]?.id.toString()!,
    rating: 5,
    comment: 'Excelente carro, muito satisfeito com a compra!',
    userDisplayName: bidderUsers[1]?.fullName!,
  });

  // --- Seed Notifications ---
  console.log("Seeding Notifications...");
  await services.notification.createNotification({
    userId: bidderUsers[0]?.id.toString()!,
    message: 'Você foi superado no Lote 001 - Ford Ka 2019.',
    link: `/lots/${lotCar?.id.toString()}`,
    tenant: { connect: { id: BigInt(tenantId) } },
  });
  await services.notification.createNotification({
    userId: adminUser?.id.toString()!,
    message: 'Novo documento enviado para análise.',
    link: `/admin/users/${bidderUsers[0]?.id.toString()}/documents`,
    tenant: { connect: { id: BigInt(tenantId) } },
  });

  // --- Seed User Lot Max Bids ---
  console.log("Seeding User Lot Max Bids...");
  await services.userLotMaxBid.createOrUpdateUserLotMaxBid({
    userId: bidderUsers[0]?.id.toString()!,
    lotId: lotApartment?.id.toString()!,
    maxAmount: 800000.00,
  });

  // --- Seed Contact Message ---
  console.log("Seeding Contact Message...");
  const contactMessageResult = await services.contactMessage.saveMessage({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    subject: 'Dúvida sobre Leilão Judicial',
    message: 'Gostaria de mais informações sobre o processo 0012345-67.2024.8.26.0001.',
  });
  if (!contactMessageResult.success) throw new Error(contactMessageResult.message);

  // --- Seed Data Source ---
  console.log("Seeding Data Source...");
  const dataSourceResult = await services.dataSource.upsertDataSource({
    name: 'Leilões Ativos',
    modelName: 'Auction',
    fields: {
      id: { type: 'string', label: 'ID do Leilão' },
      title: { type: 'string', label: 'Título' },
      status: { type: 'enum', label: 'Status' },
    },
  });
  if (!dataSourceResult.success) throw new Error(dataSourceResult.message);

  // --- Seed Document Template ---
  console.log("Seeding Document Template...");
  const documentTemplateResult = await services.documentTemplate.createDocumentTemplate({
    name: 'Termo de Arrematação Padrão',
    type: 'WINNING_BID_TERM',
    content: '<h1>Termo de Arrematação</h1><p>Este documento certifica que {{userName}} arrematou o lote {{lotTitle}} no leilão {{auctionTitle}} pelo valor de {{winningBidAmount}}.</p>',
  });
  if (!documentTemplateResult.success) throw new Error(documentTemplateResult.message);

  // --- Seed Report ---
  console.log("Seeding Report...");
  const reportResult = await services.report.createReport({
    name: 'Relatório de Vendas Mensal',
    description: 'Relatório consolidado das vendas do mês.',
    definition: {
      sections: [
        { type: 'text', content: '<h1>Relatório de Vendas</h1>' },
        { type: 'chart', chartType: 'bar', dataKey: 'monthlySales' },
      ],
    },
  }, tenantId.toString());
  if (!reportResult.success) throw new Error(reportResult.message);

  // --- Seed Subscriber ---
  console.log("Seeding Subscriber...");
  const subscriberResult = await services.subscriber.createSubscriber({
    email: faker.internet.email(),
    name: faker.person.fullName(),
    preferences: { newsletter: true, promotions: false },
  }, tenantId.toString());
  if (!subscriberResult.success) throw new Error(subscriberResult.message);

  console.log("--- SEED SCRIPT V2 FINISHED SUCCESSFULLY ---");
}

main()
  .catch((e) => {
    console.error("--- SEED SCRIPT V2 FAILED ---");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });