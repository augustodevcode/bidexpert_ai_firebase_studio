
/**
 * @file Extended Seed Script (v2)
 * @version 2.3
 * @description Populates the database with a comprehensive and interconnected set of data
 *              that covers all major scenarios of the BidExpert application.
 * 
 * @ai-guidelines
 *   - 1. SCRIPT PHILOSOPHY: This script uses SERVICE classes for creating business entities
 *     (Auctions, Lots, Users, etc.) to ensure all business logic is applied. Direct
 *     database calls (`prisma.create`) are ONLY used for foundational, non-business
 *     data like the Landlord Tenant and global settings where a fixed ID or
 *     bootstrapping is necessary.
 * 
 *   - 2. WHY NOT ACTIONS: Server Actions (`.../actions.ts`) are NOT used because they
 *     import `server-only`, which causes this script (running in a standard Node.js
 *     environment) to fail. The services contain the core logic, so using them is the
 *     correct approach here.
 * 
 *   - 3. ID TYPES: All service methods are designed to accept and return IDs as `string`.
 *     The conversion to and from `BigInt` is handled within the service/repository layer.
 *     Therefore, this script should ONLY work with string IDs when interacting with services.
 * 
 *   - 4. ADDING NEW ENTITIES: To add a new entity, first check if a service exists in
 *     `../src/services/`. If so, import it, instantiate it, and use its `create` or
 *     update method. Follow the existing patterns in the `seed...` functions below.
 * 
 *   - 5. DATABASE CLEANING: The `cleanDatabase` function at the beginning is critical.
 *     If you add a new model to the schema with relations, you MUST add its table to this list in the correct reverse dependency order.
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { hash } from 'bcryptjs';
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
import type { Prisma, Role } from '@prisma/client';
import type { AssetFormData } from '../src/types';


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

async function cleanDatabase() {
    console.log("Cleaning database...");
    const modelNames = Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$'));

    for (const modelName of modelNames.reverse()) { // Reverse order might help with dependencies
        try {
            // @ts-ignore
            await prisma[modelName].deleteMany({});
        } catch (error) {
            console.warn(`Could not clean ${modelName}:`, error);
        }
    }
    console.log("Database cleaned.");
}

async function main() {
  console.log("--- STARTING EXTENDED SEED (V2.3) ---");
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
    update: {},
    create: { id: 1n, name: 'Landlord', subdomain: 'www', domain: 'bidexpert.com.br' },
  });
  const tenantId = landlordTenant.id.toString();

  const platformSettings = await prisma.platformSettings.upsert({
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

  const auctioneerUserResult = await services.user.createUser({
    email: 'leilo@bidexpert.com.br',
    fullName: 'Leiloeiro de Teste',
    password: 'Admin@123',
    habilitationStatus: 'HABILITADO',
    roleIds: [createdRoles['AUCTIONEER'].id],
    tenantId: tenantId,
  });
  if (!auctioneerUserResult.success || !auctioneerUserResult.userId) throw new Error(auctioneerUserResult.message);
  const auctioneerUser = await services.user.getUserById(auctioneerUserResult.userId);


  const sellerUserResult = await services.user.createUser({
    email: 'comit@bidexpert.com.br',
    fullName: 'Comitente de Teste',
    password: 'Admin@123',
    habilitationStatus: 'HABILITADO',
    roleIds: [createdRoles['CONSIGNOR'].id],
    tenantId: tenantId,
  });
  if (!sellerUserResult.success || !sellerUserResult.userId) throw new Error(sellerUserResult.message);
  const sellerUser = await services.user.getUserById(sellerUserResult.userId);


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
    if (!userResult.success || !userResult.userId) throw new Error(userResult.message);
    const user = await services.user.getUserById(userResult.userId);
    bidderUsers.push(user);
  }
  console.log("Users created.");

  console.log("Creating business entities...");
  const stateSP = createdStates['SP'];
  if(!stateSP) throw new Error("State SP not found");

  const citySPResult = await services.city.createCity({ name: 'São Paulo', stateId: stateSP.id, ibgeCode: '3550308' });
  if(!citySPResult.success || !citySPResult.cityId) throw new Error(citySPResult.message);
  const citySP = await services.city.getCityById(citySPResult.cityId);

  const courtTJSPResult = await services.court.createCourt({ name: 'Tribunal de Justiça de São Paulo', stateUf: 'SP', website: '' });
  if(!courtTJSPResult.success || !courtTJSPResult.courtId) throw new Error(courtTJSPResult.message);
  const courtTJSP = await services.court.getCourtById(courtTJSPResult.courtId);

  if(!courtTJSP) throw new Error("Court TJSP not found");
  const districtSPResult = await services.judicialDistrict.createJudicialDistrict({ name: 'Comarca de São Paulo', courtId: courtTJSP.id, stateId: stateSP.id, zipCode: '' });
  if(!districtSPResult.success || !districtSPResult.districtId) throw new Error(districtSPResult.message);
  const districtSP = await services.judicialDistrict.getJudicialDistrictById(districtSPResult.districtId);

  if(!districtSP) throw new Error("Judicial District SP not found");
  const branchCivilResult = await services.judicialBranch.createJudicialBranch({ name: '1ª Vara Cível', districtId: districtSP.id, contactName: '', phone: '', email: '' });
  if(!branchCivilResult.success || !branchCivilResult.branchId) throw new Error(branchCivilResult.message);
  const branchCivil = await services.judicialBranch.getJudicialBranchById(branchCivilResult.branchId);

  const mainAuctioneerResult = await services.auctioneer.createAuctioneer(tenantId.toString(), {
    name: 'Leiloeiro Oficial & Associados',
    registrationNumber: 'JUCESP-123',
    userId: auctioneerUser!.id,
    city: 'São Paulo',
    website: '', zipCode: '', contactName: '', phone: '', email: '', address: '', state: 'SP',
    description: '', logoUrl: null, logoMediaId: null, dataAiHintLogo: null,
  });
  if(!mainAuctioneerResult.success || !mainAuctioneerResult.auctioneerId) throw new Error(mainAuctioneerResult.message);
  const mainAuctioneer = await services.auctioneer.getAuctioneerById(tenantId.toString(), mainAuctioneerResult.auctioneerId);

  if(!branchCivil) throw new Error("Judicial Branch Civil not found");
  const judicialSellerResult = await services.seller.createSeller(tenantId.toString(), {
    name: '1ª Vara Cível de São Paulo',
    isJudicial: true,
    judicialBranchId: branchCivil.id,
    userId: null,
    city: 'São Paulo', website: '', zipCode: '', contactName: '', phone: '', email: '', address: '', state: 'SP',
    description: '', logoUrl: null, logoMediaId: null, dataAiHintLogo: null,
  });
  if(!judicialSellerResult.success || !judicialSellerResult.sellerId) throw new Error(judicialSellerResult.message);
  const judicialSeller = await services.seller.getSellerById(tenantId.toString(), judicialSellerResult.sellerId);

  const extrajudicialSellerResult = await services.seller.createSeller(tenantId.toString(), {
    name: 'Banco Vende Tudo S/A',
    isJudicial: false,
    userId: sellerUser!.id,
    city: 'São Paulo', website: '', zipCode: '', contactName: '', phone: '', email: '', address: '',
    state: 'SP', description: '', logoUrl: null, logoMediaId: null, dataAiHintLogo: null,
  });
  if(!extrajudicialSellerResult.success || !extrajudicialSellerResult.sellerId) throw new Error(extrajudicialSellerResult.message);
  const extrajudicialSeller = await services.seller.getSellerById(tenantId.toString(), extrajudicialSellerResult.sellerId);

  const catImoveisResult = await services.category.createCategory({ name: 'Imóveis', description: 'Imóveis em geral' });
  if(!catImoveisResult.success || !catImoveisResult.category) throw new Error(catImoveisResult.message);
  const catImoveis = catImoveisResult.category;

  const catVeiculosResult = await services.category.createCategory({ name: 'Veículos', description: 'Veículos automotores' });
  if(!catVeiculosResult.success || !catVeiculosResult.category) throw new Error(catVeiculosResult.message);
  const catVeiculos = catVeiculosResult.category;

  await services.subcategory.createSubcategory({ name: 'Apartamentos', parentCategoryId: catImoveis.id, description: '', displayOrder: 0, iconUrl: '', iconMediaId: null, dataAiHintIcon: '' });
  await services.subcategory.createSubcategory({ name: 'Carros', parentCategoryId: catVeiculos.id, description: '', displayOrder: 0, iconUrl: '', iconMediaId: null, dataAiHintIcon: '' });

  if(!courtTJSP || !districtSP || !branchCivil || !judicialSeller) throw new Error("Judicial entity setup failed.");
  const judicialProcessResult = await services.judicialProcess.createJudicialProcessAction({
    processNumber: '0012345-67.2024.8.26.0001',
    isElectronic: true,
    parties: [],
    courtId: courtTJSP.id,
    districtId: districtSP.id,
    branchId: branchCivil.id,
    sellerId: judicialSeller.id,
  });
  if(!judicialProcessResult.success || !judicialProcessResult.processId) throw new Error(judicialProcessResult.message);
  const judicialProcess = await services.judicialProcess.getJudicialProcess(judicialProcessResult.processId);

  const assetApartmentResult = await services.asset.createAsset(tenantId, {
    title: 'Apartamento em Moema, 2 dorms', description: 'Lindo apartamento com vista para o parque.',
    categoryId: catImoveis.id, evaluationValue: 750000.00, judicialProcessId: judicialProcess!.id,
    sellerId: judicialSeller.id, locationCity: 'São Paulo', locationState: 'SP', status: 'DISPONIVEL',
  } as AssetFormData);
  if(!assetApartmentResult.success || !assetApartmentResult.assetId) throw new Error(assetApartmentResult.message);
  const assetApartment = await services.asset.getAssetById(tenantId, assetApartmentResult.assetId);

  const assetCarResult = await services.asset.createAsset(tenantId, {
    title: 'Ford Ka 2019', description: 'Carro em ótimo estado, único dono.',
    categoryId: catVeiculos.id, evaluationValue: 45000.00, sellerId: extrajudicialSeller!.id,
    locationCity: 'São Paulo', locationState: 'SP', status: 'DISPONIVEL', make: 'Ford', model: 'Ka', year: 2019, modelYear: 2019,
  } as AssetFormData);
  if(!assetCarResult.success || !assetCarResult.assetId) throw new Error(assetCarResult.message);
  const assetCar = await services.asset.getAssetById(tenantId, assetCarResult.assetId);

  const judicialAuctionResult = await services.auction.createAuction(tenantId.toString(), {
    title: 'Leilão Judicial de Imóveis - TJSP', auctionType: 'JUDICIAL', status: 'ABERTO_PARA_LANCES',
    auctioneerId: mainAuctioneer!.id, sellerId: judicialSeller.id, auctionDate: faker.date.future(),
  });
  if(!judicialAuctionResult.success || !judicialAuctionResult.auctionId) throw new Error(judicialAuctionResult.message);
  const judicialAuction = await services.auction.getAuctionById(tenantId.toString(), judicialAuctionResult.auctionId);

  const extrajudicialAuctionResult = await services.auction.createAuction(tenantId.toString(), {
    title: 'Leilão de Veículos do Banco Vende Tudo', auctionType: 'EXTRAJUDICIAL', status: 'ABERTO_PARA_LANCES',
    auctioneerId: mainAuctioneer!.id, sellerId: extrajudicialSeller!.id, auctionDate: faker.date.future(),
  });
  if(!extrajudicialAuctionResult.success || !extrajudicialAuctionResult.auctionId) throw new Error(extrajudicialAuctionResult.message);
  const extrajudicialAuction = await services.auction.getAuctionById(tenantId.toString(), extrajudicialAuctionResult.auctionId);

  if(!assetApartment || !judicialAuction) throw new Error("Asset Apartment or Judicial Auction not found");
  const lotApartmentResult = await services.lot.createLot({
    auctionId: judicialAuction.id, title: 'Lote 001 - Apartamento em Moema', number: '001',
    price: 750000.00, assetIds: [assetApartment.id],
  }, tenantId.toString(), adminUser!.id);
  if(!lotApartmentResult.success || !lotApartmentResult.lotId) throw new Error(lotApartmentResult.message);
  const lotApartment = await services.lot.getLotById(lotApartmentResult.lotId);

  if(!assetCar || !extrajudicialAuction) throw new Error("Asset Car or Extrajudicial Auction not found");
  await services.lot.createLot({
    auctionId: extrajudicialAuction.id, title: 'Lote 001 - Ford Ka 2019', number: '001',
    price: 45000.00, assetIds: [assetCar.id],
  }, tenantId.toString(), adminUser!.id);

  for (const user of bidderUsers) {
    if (!user) continue;
    await services.habilitation.upsertAuctionHabilitation({ userId: user.id, auctionId: judicialAuction!.id } as any);
    await services.habilitation.upsertAuctionHabilitation({ userId: user.id, auctionId: extrajudicialAuction!.id } as any);
  }

  const bidder1 = bidderUsers[0];
  if(!bidder1 || !lotApartment || !extrajudicialAuction) throw new Error("Bidder or lot info missing");
  await services.bid.createBid({ lotId: lotApartment.id, bidderId: bidder1.id, amount: new Decimal(755000.00), auctionId: judicialAuction!.id, tenantId: BigInt(tenantId) } as any);
  
  const lotCar = await prisma.lot.findFirst({ where: { auctionId: BigInt(extrajudicialAuction.id) }});
  if (!lotCar) throw new Error('Lot for extrajudicial auction not found');

  const bidder2 = bidderUsers[1];
  if(!bidder2) throw new Error("Bidder 2 not found");
  await services.bid.createBid({ lotId: lotCar.id, bidderId: bidder2.id, amount: new Decimal(46000.00), auctionId: extrajudicialAuction.id, tenantId: BigInt(tenantId) } as any);

  const winningBid = await prisma.bid.findFirst({ where: { lotId: lotCar.id }, orderBy: { amount: 'desc' } });
  if (winningBid) {
    const userWin = await services.userWin.create({
      lotId: lotCar.id,
      userId: winningBid.bidderId,
      winningBidAmount: winningBid.amount,
      paymentStatus: 'PENDENTE',
    } as any);
    if(userWin) {
      await services.installmentPayment.createInstallmentsForWin(userWin as any, 3);
    }
  }

  const docTypeRGResult = await services.documentType.upsertDocumentType({ name: 'RG', description: 'Documento de Identidade', isRequired: true, appliesTo: 'PHYSICAL' });
  const docTypeCPFResult = await services.documentType.upsertDocumentType({ name: 'CPF', description: 'Cadastro de Pessoa Física', isRequired: true, appliesTo: 'PHYSICAL' });
  if(!docTypeRGResult || !docTypeCPFResult) throw new Error("Failed to create document types");
  
  if(adminUser) {
    await services.userDocument.createUserDocument({ user: { connect: { id: adminUser.id } }, documentType: { connect: { id: docTypeRGResult.id } }, fileUrl: faker.image.url(), fileName: 'rg_admin.pdf' });
    await services.userDocument.createUserDocument({ user: { connect: { id: adminUser.id } }, documentType: { connect: { id: docTypeCPFResult.id } }, fileUrl: faker.image.url(), fileName: 'cpf_admin.pdf' });
  }

  const mediaItem1Result = await services.mediaItem.createMediaItem({
    fileName: 'apartment_image.jpg', mimeType: 'image/jpeg', storagePath: '/uploads/apartment_image.jpg',
    urlOriginal: faker.image.url(), title: 'Apartamento Moema', user: { connect: { id: adminUser!.id } }
  });
  if (!mediaItem1Result.success) throw new Error(mediaItem1Result.message);
  
  await services.vehicleMake.createVehicleMake({ name: 'Ford' });
  const makeResult = await services.vehicleMake.createVehicleMake({ name: 'Chevrolet' });
  if(makeResult.success && makeResult.makeId) {
    await services.vehicleModel.createVehicleModel({ name: 'Onix', makeId: makeResult.makeId });
  }

  await services.contactMessage.saveMessage({
    name: faker.person.fullName(), email: faker.internet.email(), subject: 'Dúvida sobre Leilão Judicial',
    message: 'Gostaria de mais informações sobre o processo 0012345-67.2024.8.26.0001.',
  });

  await services.dataSource.upsertDataSource({
    name: 'Leilões Ativos', modelName: 'Auction',
    fields: { id: { type: 'string', label: 'ID do Leilão' }, title: { type: 'string', label: 'Título' }, status: { type: 'enum', label: 'Status' } },
  });

  await services.documentTemplate.createDocumentTemplate({
    name: 'Termo de Arrematação Padrão', type: 'WINNING_BID_TERM',
    content: '<h1>Termo de Arrematação</h1><p>Este documento certifica que {{userName}} arrematou o lote {{lotTitle}} no leilão {{auctionTitle}} pelo valor de {{winningBidAmount}}.</p>',
  });

  await services.report.createReport({
    name: 'Relatório de Vendas Mensal', description: 'Relatório consolidado das vendas do mês.',
    definition: { sections: [ { type: 'text', content: '<h1>Relatório de Vendas</h1>' }, { type: 'chart', chartType: 'bar', dataKey: 'monthlySales' }, ] },
    createdById: adminUser!.id
  }, tenantId.toString());

  await services.subscriber.createSubscriber({ email: faker.internet.email(), name: faker.person.fullName(), }, tenantId.toString());

  console.log("--- SEED SCRIPT V2.3 FINISHED SUCCESSFULLY ---");
}

main()
  .catch((e) => {
    console.error("--- SEED SCRIPT V2.3 FAILED ---");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

    