import { faker } from '@faker-js/faker';
import { seedLogger } from './seed-logger';
import { SeedValidator, SeedValidationConfig } from './seed-validator';
import { TransactionManager } from './transaction-manager';
import { createConnectId, createConnectIds } from './types';
import { AssetStatus, PaymentStatus, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { createServiceExtensions } from './service-extensions';
import { enrichAssetLocations } from './seed-asset-location';
import { attachMediaGalleryToAssets, seedMediaItems } from './seed-asset-media';
import { seedAssetCategories } from './seed-asset-categories';

// Import services individually to avoid path issues
import { TenantService } from '../src/services/tenant.service';
import { PlatformSettingsService } from '../src/services/platform-settings.service';
import { MentalTriggerSettingsService } from '../src/services/mental-trigger-settings.service';
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
import { AuctionStageService } from '../src/services/auction-stage.service';
import { LotService } from '../src/services/lot.service';
import { AuctionHabilitationService } from '../src/services/auction-habilitation.service';
import { BidService } from '../src/services/bid.service';
import { UserWinService } from '../src/services/user-win.service';
import { InstallmentPaymentService } from '../src/services/installment-payment.service';
import { PaymentMethodService } from '../src/services/payment-method.service';
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

import type { 
  Role, 
  Asset, 
  AssetFormData, 
    AuctionStatus, 
    LotStatus, 
    Auction, 
    Lot, 
    JudicialDistrict, 
    JudicialBranch, 
    Court, 
    CityInfo as City, 
    StateInfo, 
    JudicialProcessFormData, 
    UserWin, 
    DocumentType, 
    VehicleMake, 
    VehicleModel, 
    MediaItem 
} from '../src/types';

import { prisma } from '../src/lib/prisma';

// Initialize all services
const services = {
    tenant: new TenantService(),
    platformSettings: new PlatformSettingsService(),
    mentalTriggerSettings: new MentalTriggerSettingsService(),
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
    auctionStage: new AuctionStageService(),
    lot: new LotService(),
    habilitation: new AuctionHabilitationService(),
    bid: new BidService(),
    userWin: new UserWinService(),
    installmentPayment: new InstallmentPaymentService(),
    paymentMethod: new PaymentMethodService(),
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
  { name: 'Lawyer', nameNormalized: 'LAWYER', description: 'Acesso ao portal jurídico e gestão de casos.', permissions: ['lawyer_dashboard:view', 'lawyer_cases:view', 'lawyer_documents:manage'] },
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
    COURT_COUNT: 5,
    JUDICIAL_DISTRICT_COUNT: 10,
    JUDICIAL_BRANCH_COUNT: 15,
    JUDICIAL_PROCESS_COUNT: 8,
    CITY_COUNT: 10,
    VEHICLE_MAKE_COUNT: 10,
    VEHICLE_MODEL_COUNT: 30,
    MEDIA_ITEM_COUNT: 50,
    MENTAL_TRIGGERS_COUNT: 5,
    INSTALLMENTS_PER_WIN: 12,
    DIRECT_SALE_OFFERS_COUNT: 10,
};

const LawyerSeedConfig = {
  user: {
    email: 'advogado@bidexpert.com.br',
    password: 'Test@12345',
    fullName: 'Ana Paula Souza',
    cpf: '12345678901',
    phone: '+55 11 98877-6655',
  },
  deterministicProcessNumber: '5001234-56.2025.8.26.0100',
  deterministicAssetTitle: 'Apartamento Duplex 320m² – Jardins',
};

function aggregateAssetValue(assets: Asset[]): number {
  const computed = assets.reduce((sum, asset) => {
    const rawValue = typeof asset.evaluationValue === 'number'
      ? asset.evaluationValue
      : Number(asset.evaluationValue ?? 0);
    return sum + (rawValue || 0);
  }, 0);
  return computed > 0 ? computed : faker.number.int({ min: 80000, max: 350000 });
}

function pickAssetsFromProcessPool(pool: Asset[]): Asset[] {
  if (!pool?.length) return [];
  if (pool.length === 1) return [pool.shift()!];

  const selectionSize = faker.helpers.weightedArrayElement([
    { value: 1, weight: 0.45 },
    { value: Math.min(2, pool.length), weight: 0.35 },
    { value: Math.min(3, pool.length), weight: 0.2 },
  ]);

  const selection: Asset[] = [];
  for (let i = 0; i < selectionSize; i++) {
    const picked = pool.shift();
    if (!picked) break;
    selection.push(picked);
  }
  return selection;
}

async function linkLotToJudicialProcess(lotId: string | bigint, processId: string | bigint) {
  try {
    await prisma.lot.update({
      where: { id: BigInt(lotId) },
      data: {
        judicialProcesses: {
          connect: { id: BigInt(processId) },
        },
      },
    });
  } catch (error) {
    console.warn('Failed to link lot to judicial process:', error);
  }
}

async function cleanDatabase() {
    console.log("Cleaning database...");
    try {
        // Desativar verificação de chaves estrangeiras temporariamente (MySQL)
        await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;
        
        // Lista manual das tabelas na ordem correta de exclusão
        const tablesToDelete = [
            'InstallmentPayment',
            'Bid',
            'UserWin',
            'UserLotMaxBid',
            'LotQuestion',
            'Review',
            'Notification',
            'AuctionHabilitation',
            'AuctionStage',
            'DirectSaleOffer',
            'Lot',
            'Auction',
            'Asset',
            'JudicialProcess',
            'UserDocument',
            'UsersOnRoles',
            'User',
            'Seller',
            'Auctioneer',
            'Report',
            'Role',
            'Subcategory',
            'LotCategory',
            'VehicleModel',
            'VehicleMake',
            'Court',
            'City',
            'State',
            'DocumentType',
            'MediaItem',
            'Subscriber',
            'Tenant'
        ];
        
        // Excluir tabelas na ordem correta
        for (const tableName of tablesToDelete) {
            try {
                // Usando template literals com crase para escapar nomes de tabela
                await prisma.$executeRawUnsafe(`DELETE FROM \`${tableName}\`;`);
                console.log(`Tabela limpa: ${tableName}`);
            } catch (error) {
                console.warn(`Erro ao limpar tabela ${tableName}:`, error);
            }
        }
        
        // Reativar verificação de chaves estrangeiras (MySQL)
        await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;
        
        console.log("Database cleaned successfully");
    } catch (error) {
        console.error("Error cleaning database:", error);
        // Garantir que as chaves estrangeiras sejam reativadas em caso de erro
        try {
            await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;
        } catch (e) {
            console.error("Failed to re-enable foreign key checks:", e);
        }
        throw error;
    }
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
  
  // Garantir que os IDs dos roles sejam strings para uso posterior
  Object.keys(createdRoles).forEach(key => {
    if (createdRoles[key] && typeof createdRoles[key].id !== 'string') {
      createdRoles[key] = { ...createdRoles[key], id: String(createdRoles[key].id) };
    }
  });

  console.log("Usando tenantId fixo = 1");
  const tenantId = '1';
  
  // Garantir que o tenant com ID 1 existe
  try {
    await services.tenant.getTenantById(tenantId);
    console.log(`Usando tenant existente com ID: ${tenantId}`);
  } catch (error) {
    console.log(`Criando tenant com ID: ${tenantId}`);
    const tenantResult = await services.tenant.createTenant({
      id: BigInt(tenantId),
      name: 'Tenant Principal',
      subdomain: 'main',
    });
    
    if (!tenantResult.success || !tenantResult.tenant) {
      throw new Error(`Falha ao criar tenant: ${tenantResult.message}`);
    }
    
    console.log("Tenant criado com sucesso com ID:", tenantId);
  }

  await services.platformSettings.getSettings(tenantId);

  const createdStates: Record<string, StateInfo> = {};
  console.log("Criando estados brasileiros...");
  for (const state of brazilianStates) {
    console.log(`Criando estado: ${state.name} (${state.uf})`);
    const newStateResult = await services.state.createState({ ...state });
    console.log("Resultado da criação:", newStateResult);
    
    if (!newStateResult.success || !newStateResult.stateId) {
      console.error(`Falha ao criar estado ${state.uf}:`, newStateResult.message);
      throw new Error(newStateResult.message);
    }
    
    const newState = await services.state.getStateById(newStateResult.stateId);
    console.log(`Estado criado:`, newState);
    
    if (!newState) {
      console.error(`Estado ${state.uf} criado mas não encontrado no banco de dados`);
      throw new Error(`Falha ao recuperar estado ${state.uf} após criação`);
    }
    
    createdStates[state.uf] = newState;
    console.log(`Estado ${state.uf} adicionado ao dicionário`);
  }
  console.log("Foundational data seeded.");

  console.log("Creating users...");
  const adminUserResult = await services.user.createUser({
    email: 'admin@bidexpert.com.br',
    fullName: 'Administrador',
    password: 'Admin@123',
    habilitationStatus: 'HABILITADO',
    accountType: 'LEGAL',
    roleIds: [String(createdRoles['ADMINISTRATOR'].id)],
    tenantId: tenantId,
  });
  if (!adminUserResult.success || !adminUserResult.userId) throw new Error(adminUserResult.message);
  const adminUser = await services.user.getUserById(adminUserResult.userId.toString());

  const auctioneerUsers = [];
  for (let i = 0; i < 3; i++) {
      const userResult = await services.user.createUser({
          email: `leilo${i}@bidexpert.com.br`,
          fullName: faker.person.fullName(),
          password: 'Admin@123',
          habilitationStatus: 'HABILITADO',
          roleIds: [String(createdRoles['AUCTIONEER'].id)],
          tenantId: tenantId,
      });
      if (!userResult.success || !userResult.userId) throw new Error(userResult.message);
      auctioneerUsers.push(await services.user.getUserById(userResult.userId.toString()));
  }

  const sellerUsers = [];
    for (let i = 0; i < 5; i++) {
        const userResult = await services.user.createUser({
            email: `comit${i}@bidexpert.com.br`,
            fullName: faker.person.fullName(),
            password: 'Admin@123',
            habilitationStatus: 'HABILITADO',
            roleIds: [String(createdRoles['CONSIGNOR'].id)],
            tenantId: tenantId,
        });
        if (!userResult.success || !userResult.userId) throw new Error(userResult.message);
        sellerUsers.push(await services.user.getUserById(userResult.userId.toString()));
    }


  const lawyerUsers: any[] = [];
  const lawyerRole = createdRoles['LAWYER'];
  if (!lawyerRole) {
    throw new Error('Perfil LAWYER não foi criado corretamente.');
  }

  const primaryLawyerResult = await services.user.createUser({
    email: LawyerSeedConfig.user.email,
    fullName: LawyerSeedConfig.user.fullName,
    password: LawyerSeedConfig.user.password,
    habilitationStatus: 'HABILITADO',
    accountType: 'LEGAL',
    roleIds: [String(lawyerRole.id)],
    tenantId: tenantId,
    cpf: LawyerSeedConfig.user.cpf,
    cellPhone: LawyerSeedConfig.user.phone,
  });

  if (!primaryLawyerResult.success || !primaryLawyerResult.userId) {
    throw new Error(primaryLawyerResult.message);
  }

  const primaryLawyerProfile = await services.user.getUserById(primaryLawyerResult.userId.toString());
  if (primaryLawyerProfile) {
    lawyerUsers.push(primaryLawyerProfile);
  }


  const bidderUsers: any[] = [];
  for (let i = 0; i < Constants.USER_COUNT; i++) {
    const userResult = await services.user.createUser({
      email: faker.internet.email(),
      fullName: faker.person.fullName(),
      password: 'Admin@123',
      habilitationStatus: i % 5 === 0 ? 'PENDING_DOCUMENTS' : 'HABILITADO',
      roleIds: [String(createdRoles['BIDDER'].id)],
      tenantId: tenantId,
    });
    if (!userResult.success || !userResult.userId) throw new Error(userResult.message);
    bidderUsers.push(await services.user.getUserById(userResult.userId.toString()));
  }
  console.log(`${Constants.USER_COUNT} bidder users created.`);

  console.log("Creating business entities (Cities, Courts, Sellers, etc.)...");
  
  const cities: City[] = [];
  const citySPResult = await services.city.createCity({ name: 'São Paulo', stateId: createdStates['SP'].id, ibgeCode: '3550308' });
  if(!citySPResult.success || !citySPResult.cityId) throw new Error(citySPResult.message);
  cities.push((await services.city.getCityById(citySPResult.cityId))!);

  const cityRJResult = await services.city.createCity({ name: 'Rio de Janeiro', stateId: createdStates['RJ'].id, ibgeCode: '3304557' });
  if(!cityRJResult.success || !cityRJResult.cityId) throw new Error(cityRJResult.message);
  cities.push((await services.city.getCityById(cityRJResult.cityId))!);

  const additionalCityNames = ['Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Salvador', 'Brasília', 'Fortaleza', 'Recife', 'Manaus'];
  for (const cityName of additionalCityNames) {
    const stateUF = faker.helpers.arrayElement(['SP', 'RJ', 'MG', 'PR', 'RS', 'BA', 'DF', 'CE', 'PE', 'AM']);
    const state = createdStates[stateUF];
    if (state) {
      const cityResult = await services.city.createCity({
        name: cityName, 
        stateId: state.id, 
        ibgeCode: faker.string.numeric(7) 
      });
      if (cityResult.success && cityResult.cityId) {
        cities.push((await services.city.getCityById(cityResult.cityId))!);
      }
    }
  }
  console.log(`${cities.length} cities created.`);

  console.log("Creating courts...");
  const courts: Court[] = [];
  const courtNames = ['Tribunal de Justiça de São Paulo', 'Tribunal de Justiça do Rio de Janeiro', 'Tribunal de Justiça de Minas Gerais', 'Tribunal Regional Federal da 3ª Região', 'Tribunal de Justiça do Paraná'];
  for (const courtName of courtNames) {
        const courtResult = await services.court.createCourt({ name: courtName, website: faker.internet.url(), stateUf: faker.helpers.arrayElement(brazilianStates).uf });
    if (courtResult.success && courtResult.courtId) {
      const court = await services.court.getCourtById(courtResult.courtId);
      if (court) courts.push(court);
    }
  }
  console.log(`${courts.length} courts created.`);

  console.log("Creating judicial districts...");
  const districts: JudicialDistrict[] = [];
  for (let i = 0; i < Constants.JUDICIAL_DISTRICT_COUNT; i++) {
    const stateUF = faker.helpers.arrayElement(['SP', 'RJ', 'MG', 'PR', 'RS']);
    const state = createdStates[stateUF];
    const court = faker.helpers.arrayElement(courts);
    if (state && court) {
      const districtResult = await services.judicialDistrict.createJudicialDistrict({
        name: `Comarca de ${faker.location.city()}`,
        stateId: state.id,
        courtId: court.id,
        zipCode: faker.location.zipCode(),
      });
      if (districtResult.success && districtResult.districtId) {
        const district = await services.judicialDistrict.getJudicialDistrictById(districtResult.districtId);
        if (district) districts.push(district);
      }
    }
  }
  console.log(`${districts.length} judicial districts created.`);

  console.log("Creating judicial branches...");
  const branches: JudicialBranch[] = [];
  for (let i = 0; i < Constants.JUDICIAL_BRANCH_COUNT; i++) {
    const district = faker.helpers.arrayElement(districts);
    if (district) {
      const branchResult = await services.judicialBranch.createJudicialBranch({
        name: `${faker.helpers.arrayElement(['1ª', '2ª', '3ª', '4ª', '5ª'])} Vara ${faker.helpers.arrayElement(['Cível', 'Família', 'Fazenda Pública', 'Execução Fiscal'])}`,
        districtId: district.id,
        contactName: faker.person.fullName(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
      });
      if (branchResult.success && branchResult.branchId) {
        const branch = await services.judicialBranch.getJudicialBranchById(branchResult.branchId);
        if (branch) branches.push(branch);
      }
    }
  }
  console.log(`${branches.length} judicial branches created.`);

  const auctioneers: any[] = [];
  for(let i = 0; i < auctioneerUsers.length; i++) {
      const user = auctioneerUsers[i];
      if (!user) continue;
      const result = await services.auctioneer.createAuctioneer(tenantId, {
        name: `Leiloeiro Oficial ${i + 1}`,
        registrationNumber: `JUCESP-${faker.string.numeric(5)}`,
        userId: user.id.toString(),
        city: faker.location.city(), website: faker.internet.domainName(), zipCode: faker.location.zipCode(), contactName: faker.person.fullName(), phone: faker.phone.number(), email: faker.internet.email(), address: faker.location.streetAddress(), state: 'SP',
        description: 'Leiloeiro com anos de experiência.', logoUrl: null, logoMediaId: null, dataAiHintLogo: null,
      });
      if(!result.success || !result.auctioneerId) throw new Error(result.message);
      auctioneers.push(await services.auctioneer.getAuctioneerById(tenantId, result.auctioneerId));
  }

  console.log("Creating sellers...");
  const sellers: any[] = [];
  for(let i = 0; i < sellerUsers.length; i++) {
      const user = sellerUsers[i];
      if (!user) continue;
      const result = await services.seller.createSeller(tenantId, {
        name: `Vendedor Particular ${i + 1}`,
        isJudicial: false,
        userId: user.id.toString(),
        city: faker.location.city(), website: faker.internet.domainName(), zipCode: faker.location.zipCode(), contactName: faker.person.fullName(), phone: faker.phone.number(), email: faker.internet.email(), address: faker.location.streetAddress(),
        state: 'SP', description: 'Vendedor de ativos diversos.', logoUrl: null, logoMediaId: null, dataAiHintLogo: null,
      });
      if(!result.success || !result.sellerId) throw new Error(result.message);
      sellers.push(await services.seller.getSellerById(tenantId, result.sellerId));
  }

  for (let i = 0; i < Math.min(3, branches.length); i++) {
    const branch = branches[i];
    if (branch) {
      const judicialSellerResult = await services.seller.createSeller(tenantId, {
        name: branch.name,
        isJudicial: true,
        judicialBranchId: branch.id,
        city: faker.location.city(),
        state: 'SP',
        description: 'Comitente judicial vinculado à vara.',
        logoUrl: null,
        logoMediaId: null,
        dataAiHintLogo: null,
      });
      if (judicialSellerResult.success && judicialSellerResult.sellerId) {
        const judicialSeller = await services.seller.getSellerById(tenantId, judicialSellerResult.sellerId);
        if (judicialSeller) sellers.push(judicialSeller);
      }
    }
  }
  console.log(`${sellers.length} sellers created.`);

  const seededCategories = await seedAssetCategories(services.category, services.subcategory);
  const { imoveis: catImoveis, veiculos: catVeiculos, eletronicos: catEletronicos } = seededCategories;
  console.log("Categories and subcategories created.");

  console.log("Creating vehicle makes and models...");
  const vehicleMakes: VehicleMake[] = [];
  const makeNames = ['Toyota', 'Honda', 'Volkswagen', 'Ford', 'Chevrolet', 'Fiat', 'Hyundai', 'Nissan', 'Renault', 'Peugeot'];
  for (const makeName of makeNames.slice(0, Constants.VEHICLE_MAKE_COUNT)) {
    const makeResult = await services.vehicleMake.createVehicleMake({ name: makeName });
    if (makeResult.success && makeResult.makeId) {
      const make = await services.vehicleMake.getVehicleMakeById(makeResult.makeId);
      if (make) vehicleMakes.push(make);
    }
  }

  const vehicleModels: VehicleModel[] = [];
  for (let i = 0; i < Constants.VEHICLE_MODEL_COUNT; i++) {
    const make = faker.helpers.arrayElement(vehicleMakes);
    if (make) {
      const modelResult = await services.vehicleModel.createVehicleModel({
        name: `${make.name} ${faker.helpers.arrayElement(['Sedan', 'Hatchback', 'SUV', 'Pickup', 'Coupe'])} ${faker.string.numeric(3)}`,
        makeId: make.id,
      });
      if (modelResult.success && modelResult.modelId) {
        const model = await services.vehicleModel.getVehicleModelById(modelResult.modelId);
        if (model) vehicleModels.push(model);
      }
    }
  }
  console.log(`${vehicleMakes.length} vehicle makes and ${vehicleModels.length} models created.`);

  console.log("Creating judicial processes...");
  const judicialProcesses: any[] = [];
  for (let i = 0; i < Constants.JUDICIAL_PROCESS_COUNT; i++) {
    const court = faker.helpers.arrayElement(courts);
    const district = faker.helpers.arrayElement(districts);
    const branch = faker.helpers.arrayElement(branches);
    const judicialSeller = sellers.find(s => s?.isJudicial);
    
    if (court && district && branch) {
      const processNumber = `${faker.string.numeric(7)}-${faker.string.numeric(2)}.${faker.string.numeric(4)}.${faker.string.numeric(1)}.${faker.string.numeric(2)}.${faker.string.numeric(4)}`;
      const processResult = await services.judicialProcess.createJudicialProcess(tenantId, {
        processNumber,
        isElectronic: true,
        courtId: court.id,
        districtId: district.id,
        branchId: branch.id,
        sellerId: judicialSeller?.id,
        parties: [
            {
              name: faker.person.fullName(),
              documentNumber: faker.string.numeric(11),
              partyType: 'AUTOR',
            },
            {
              name: faker.company.name(),
              documentNumber: faker.string.numeric(14),
              partyType: 'REU',
            },
            ...(lawyerUsers.length > 0
              ? (() => {
                  const assignedLawyer = faker.helpers.arrayElement(lawyerUsers);
                  if (!assignedLawyer) return [] as any[];
                  const partyType = faker.datatype.boolean({ probability: 0.6 }) ? 'ADVOGADO_AUTOR' : 'ADVOGADO_REU';
                  const lawyerName = assignedLawyer.fullName || LawyerSeedConfig.user.fullName;
                  const lawyerCpf = assignedLawyer.cpf || LawyerSeedConfig.user.cpf;
                  return [
                    {
                      name: lawyerName,
                      documentNumber: lawyerCpf,
                      partyType,
                    },
                  ];
                })()
              : []),
        ],
      } as JudicialProcessFormData);
      if (processResult.success && processResult.processId) {
        const process = await services.judicialProcess.getJudicialProcessById(tenantId, processResult.processId);
        if (process) judicialProcesses.push(process);
      }
    }
  }
  console.log(`${judicialProcesses.length} judicial processes created.`);


  if (lawyerUsers.length > 0 && courts.length > 0 && districts.length > 0 && branches.length > 0) {
    console.log('Creating deterministic lawyer case...');
    try {
      const primaryLawyer = lawyerUsers[0];
      const deterministicProcessResult = await services.judicialProcess.createJudicialProcess(tenantId, {
        processNumber: LawyerSeedConfig.deterministicProcessNumber,
        isElectronic: true,
        courtId: courts[0].id,
        districtId: districts[0].id,
        branchId: branches[0].id,
        parties: [
          {
            name: 'Condomínio Jardim Paulista',
            documentNumber: faker.string.numeric(14),
            partyType: 'AUTOR',
          },
          {
            name: 'Carlos Menezes',
            documentNumber: faker.string.numeric(11),
            partyType: 'REU',
          },
          {
            name: primaryLawyer.fullName || LawyerSeedConfig.user.fullName,
            documentNumber: primaryLawyer.cpf || LawyerSeedConfig.user.cpf,
            partyType: 'ADVOGADO_AUTOR',
          },
        ],
      } as JudicialProcessFormData);

      if (deterministicProcessResult.success && deterministicProcessResult.processId) {
        const deterministicProcess = await services.judicialProcess.getJudicialProcessById(tenantId, deterministicProcessResult.processId);
        if (deterministicProcess) {
          judicialProcesses.push(deterministicProcess);

          const judicialSeller = sellers.find((s: any) => s?.isJudicial) || sellers[0];

          const deterministicAssetResult = await services.asset.createAsset(tenantId, {
            title: LawyerSeedConfig.deterministicAssetTitle,
            description: 'Apartamento duplex com 3 suítes, 2 vagas de garagem e vista panorâmica.',
            categoryId: catImoveis.id,
            evaluationValue: 1250000,
            sellerId: judicialSeller?.id,
            locationCity: 'São Paulo',
            locationState: 'SP',
            status: 'DISPONIVEL',
            judicialProcessId: deterministicProcess.id?.toString?.() ?? deterministicProcess.id,
          } as AssetFormData);

          let deterministicAssetId: string | null = null;
          if (deterministicAssetResult.success && deterministicAssetResult.assetId) {
            const deterministicAsset = await services.asset.getAssetById(tenantId, deterministicAssetResult.assetId);
            deterministicAssetId = deterministicAsset?.id?.toString() ?? null;
          }

          const auctionDate = new Date();
          auctionDate.setDate(auctionDate.getDate() + 3);

          const auctioneerForDeterministic = auctioneers[0]?.id?.toString() || auctioneers[1]?.id?.toString();
          const deterministicAuctionResult = await services.auction.createAuction(tenantId, {
            title: 'Leilão Judicial - Condomínio Paulista',
            auctionType: 'JUDICIAL',
            status: 'ABERTO_PARA_LANCES',
            auctioneerId: auctioneerForDeterministic,
            sellerId: judicialSeller?.id?.toString() || sellers[0]?.id?.toString(),
            auctionDate,
            judicialProcessId: deterministicProcess.id,
            softCloseEnabled: true,
          });

          if (deterministicAuctionResult.success && deterministicAuctionResult.auctionId) {
            const deterministicAuction = await services.auction.getAuctionById(tenantId, deterministicAuctionResult.auctionId);
            if (deterministicAuction) {
              await services.auctionStage.createAuctionStage({
                auction: { connect: { id: BigInt(deterministicAuction.id) } },
                name: '1ª Praça',
                startDate: auctionDate,
                endDate: new Date(auctionDate.getTime() + 2 * 24 * 60 * 60 * 1000),
                initialPrice: new Decimal(1100000),
              });

              const lotAssetIds = deterministicAssetId ? [deterministicAssetId] : [];
              const deterministicLotResult = await services.lot.createLot({
                auctionId: deterministicAuction.id,
                title: LawyerSeedConfig.deterministicAssetTitle,
                number: '101',
                price: 1100000,
                initialPrice: 1100000,
                status: 'ABERTO_PARA_LANCES',
                isFeatured: true,
                type: 'JUDICIAL',
                assetIds: lotAssetIds,
              }, tenantId);

              if (deterministicLotResult.success && deterministicLotResult.lotId && deterministicProcess?.id) {
                try {
                  await prisma.lot.update({
                    where: { id: BigInt(deterministicLotResult.lotId) },
                    data: {
                      judicialProcesses: {
                        connect: { id: BigInt(deterministicProcess.id) },
                      },
                      status: 'ABERTO_PARA_LANCES',
                    },
                  });
                } catch (updateError: any) {
                  console.warn('Failed to bind deterministic lot to judicial process:', updateError?.message || updateError);
                }
              } else if (!deterministicLotResult.success) {
                console.warn('Failed to create deterministic lawyer lot:', deterministicLotResult.message);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to create deterministic lawyer case:', error);
    }
  }


  console.log("Creating media items...");
  const mediaItems = await seedMediaItems(services.mediaItem, adminUser?.id, Constants.MEDIA_ITEM_COUNT);
  console.log(`${mediaItems.length} media items created.`);

  console.log("Creating assets...");
  const assets: Asset[] = [];
  const assetsByProcessId: Record<string, Asset[]> = {};

  if (judicialProcesses.length > 0) {
    console.log('  Creating dedicated assets tied to judicial processes (wizard scenarios).');
    const processAssetTemplates = [
      {
        key: 'residential_cluster',
        categoryId: catImoveis.id,
        minAssets: 3,
        maxAssets: 4,
        description: 'Residencial premium vinculado ao processo para simular agrupamento de lotes (contexto: TESTING_SCENARIOS.md 8.1.3).',
        titleFactory: (cityName: string) => `Apartamento penhorado em ${cityName}`,
      },
      {
        key: 'vehicle_fleet',
        categoryId: catVeiculos.id,
        minAssets: 2,
        maxAssets: 3,
        description: 'Frota de veículos apreendidos prontos para individualização em lotes.',
        titleFactory: (_cityName: string) => `Veículo apreendido ${faker.vehicle.manufacturer()} ${faker.vehicle.model()}`,
      },
      {
        key: 'industrial_line',
        categoryId: catEletronicos.id,
        minAssets: 2,
        maxAssets: 3,
        description: 'Linha de equipamentos industriais destinados à venda judicial.',
        titleFactory: (_cityName: string) => `Equipamento industrial ${faker.commerce.productName()}`,
      },
    ];

    const judicialFallbackSeller = sellers.find((s: any) => s?.isJudicial) || sellers[0];

    for (let index = 0; index < judicialProcesses.length; index++) {
      const process = judicialProcesses[index];
      if (!process) continue;
      const template = processAssetTemplates[index % processAssetTemplates.length];
      const city = faker.helpers.arrayElement(cities.filter(Boolean));
      const stateForCity = city ? Object.values(createdStates).find((s: any) => s.id === city.stateId) : null;
      const sellerId = process.sellerId || judicialFallbackSeller?.id?.toString();
      if (!sellerId) continue;

      const assetCount = faker.number.int({ min: template.minAssets, max: template.maxAssets });
      for (let assetIndex = 0; assetIndex < assetCount; assetIndex++) {
        const mediaItem = faker.helpers.arrayElement(mediaItems.filter(Boolean));
        const title = template.titleFactory(city?.name || faker.location.city());
        const processAssetResult = await services.asset.createAsset(tenantId, {
          title,
          description: `${template.description} Processo ${process.processNumber}.`,
          categoryId: template.categoryId,
          evaluationValue: faker.number.int({ min: 150000, max: 900000 }),
          sellerId,
          judicialProcessId: process.id,
          locationCity: city?.name,
          locationState: stateForCity?.uf,
          status: 'DISPONIVEL',
          imageUrl: mediaItem?.urlOriginal || null,
          imageMediaId: mediaItem?.id || null,
          dataAiHint: `Processo ${process.processNumber} • ${template.key}`,
        } as AssetFormData);

        if (processAssetResult.success && processAssetResult.assetId) {
          const processAsset = await services.asset.getAssetById(tenantId, processAssetResult.assetId);
          if (processAsset) {
            assets.push(processAsset);
            if (!assetsByProcessId[process.id]) {
              assetsByProcessId[process.id] = [];
            }
            assetsByProcessId[process.id].push(processAsset);
          }
        }
      }
    }

    const totalProcessAssets = Object.values(assetsByProcessId).reduce((sum, list) => sum + list.length, 0);
    console.log(`  ${totalProcessAssets} assets vinculados a ${Object.keys(assetsByProcessId).length} processos judiciais.`);
  }

  for (let i = 0; i < Constants.ASSET_COUNT; i++) {
      const category = faker.helpers.arrayElement([catImoveis, catVeiculos, catEletronicos]);
      const seller = faker.helpers.arrayElement(sellers.filter(Boolean));
      const city = faker.helpers.arrayElement(cities.filter(Boolean));
      const mediaItem = faker.helpers.arrayElement(mediaItems.filter(Boolean));

      if (!seller || !city || !category) continue;

      const state = Object.values(createdStates).find(s => s.id === city.stateId);

      let assetData: Partial<AssetFormData> = {
          title: '',
          description: faker.lorem.paragraph(),
          categoryId: category.id,
          evaluationValue: faker.number.int({ min: 1000, max: 500000 }),
          sellerId: seller.id,
          locationCity: city.name,
          locationState: state?.uf ?? 'SP',
          status: 'DISPONIVEL',
          imageUrl: mediaItem?.urlOriginal || null,
          imageMediaId: mediaItem?.id || null,
      };

      if (category.id === catVeiculos.id) {
          if (vehicleModels.length > 0) {
            const model = faker.helpers.arrayElement(vehicleModels);
            if (model) {
                const make = vehicleMakes.find(m => m.id === model.makeId);
                assetData.title = `Veículo ${make?.name || ''} ${model.name}`;
                assetData.make = make?.name;
                assetData.model = model.name;
            }
          } else {
            assetData.title = `Veículo ${faker.vehicle.manufacturer()} ${faker.vehicle.model()}`;
            assetData.make = faker.vehicle.manufacturer();
            assetData.model = faker.vehicle.model();
          }
          assetData.year = faker.date.past({ years: 10 }).getFullYear();
          assetData.modelYear = assetData.year;
      } else if (category.id === catImoveis.id) {
          assetData.title = `Imóvel em ${city.name} - ${faker.location.streetAddress(false)}`;
      } else {
          assetData.title = `Eletrônico: ${faker.commerce.productName()}`;
      }

      const assetResult = await services.asset.createAsset(tenantId, assetData as AssetFormData);
      if (!assetResult.success || !assetResult.assetId) {
          console.warn(`Failed to create asset: ${assetResult.message}`);
          continue;
      }
      const createdAsset = await services.asset.getAssetById(tenantId, assetResult.assetId);
      if (createdAsset) {
          assets.push(createdAsset);
      }
  }
  console.log(`${assets.length} assets created.`);

  const statesById = Object.values(createdStates).reduce((map, state) => {
    if (state) {
      map[state.id] = state;
    }
    return map;
  }, {} as Record<string, StateInfo>);
  const enrichedCount = await enrichAssetLocations(services.asset, assets, cities, statesById, seededCategories);
  console.log(`Location metadata refreshed for ${enrichedCount} assets.`);

  const galleryEntries = await attachMediaGalleryToAssets(assets, mediaItems);
  console.log(`${galleryEntries} asset-media links created.`);


  console.log("Creating auctions and lots...");
  const auctions: (Auction | null)[] = [];
  const generalAssetPool = faker.helpers.shuffle(assets.filter(a => a?.status === 'DISPONIVEL' && !a?.judicialProcessId));
  const processAssetPools: Record<string, Asset[]> = {};
  Object.entries(assetsByProcessId).forEach(([processId, assetList]) => {
    processAssetPools[processId] = [...assetList];
  });

  for (let i = 0; i < Constants.AUCTION_COUNT; i++) {
      const auctioneer = faker.helpers.arrayElement(auctioneers.filter(Boolean));
      const seller = faker.helpers.arrayElement(sellers.filter(Boolean));
      if (!auctioneer || !seller) continue;

      // Garantir que a maioria dos leilões estejam ativos (80% de chance)
      const status = faker.helpers.weightedArrayElement<AuctionStatus>([
        { value: 'ABERTO_PARA_LANCES', weight: 0.6 },
        { value: 'EM_BREVE', weight: 0.2 },
        { value: 'FINALIZADO', weight: 0.1 },
        { value: 'CANCELADO', weight: 0.1 }
      ]);

      const isJudicial = i % 3 === 0 && judicialProcesses.length > 0;
      const judicialProcess = isJudicial ? faker.helpers.arrayElement(judicialProcesses) : null;
      const auctionResult = await services.auction.createAuction(tenantId, {
          title: `Grande Leilão de ${seller.name} - #${i + 1}`,
          auctionType: isJudicial ? 'JUDICIAL' : 'EXTRAJUDICIAL',
          status: status,
          auctioneerId: auctioneer.id.toString(),
          sellerId: seller.id.toString(),
          auctionDate: faker.date.future(),
          softCloseEnabled: i % 2 === 0,
          judicialProcessId: judicialProcess?.id.toString(),
      });
      if (!auctionResult.success || !auctionResult.auctionId) {
          console.warn(`Failed to create auction: ${auctionResult.message}`);
          continue;
      }
      const auction = await services.auction.getAuctionById(tenantId, auctionResult.auctionId);
      if (auction) {
        auctions.push(auction);
      } else {
        continue;
      }

      if (auction && status === 'ABERTO_PARA_LANCES' && auction.auctionDate) {
        const startDate = auction.auctionDate;
        const endDate = faker.date.future({ refDate: startDate });
        const initialPrice = new Decimal(faker.number.int({ min: 10000, max: 100000 }));
        
        const stageResult = await services.auctionStage.createAuctionStage({
            auction: { connect: { id: BigInt(auction.id) } },
            name: '1ª Praça',
            startDate,
            endDate,
            initialPrice,
        });

        if (stageResult.success) {
          console.log(`  Created auction stage for auction ${auction.id}`);
        }
      }

      const numLots = faker.number.int({ min: 1, max: Constants.LOTS_PER_AUCTION_MAX });
      for (let j = 0; j < numLots; j++) {
          let selectedAssets: Asset[] = [];
          let linkedProcessId: string | null = null;

          if (judicialProcess?.id) {
            const pool = processAssetPools[judicialProcess.id];
            if (pool && pool.length) {
              selectedAssets = pickAssetsFromProcessPool(pool);
              if (selectedAssets.length) {
                linkedProcessId = judicialProcess.id;
              }
            }
          }

          if (selectedAssets.length === 0) {
            const fallbackAsset = generalAssetPool.pop();
            if (fallbackAsset) {
              selectedAssets = [fallbackAsset];
            } else {
              continue;
            }
          }

          const lotStatus = faker.helpers.weightedArrayElement([
            { value: 'EM_BREVE', weight: 0.4 },
            { value: 'ABERTO_PARA_LANCES', weight: 0.6 }
          ]);
          const isFeatured = faker.datatype.boolean({ probability: 0.3 });
          const lotValue = aggregateAssetValue(selectedAssets);
          const lotInitialPrice = Math.max(5000, Math.round(lotValue * (selectedAssets.length > 1 ? 0.7 : 0.8)));
          const baseTitle = linkedProcessId
            ? `Processo ${linkedProcessId.slice(-4)} - ${selectedAssets.length} bem(ns)`
            : selectedAssets[0].title;
          const lotTitle = linkedProcessId
            ? `${baseTitle}${selectedAssets.length > 1 ? ' (Agrupado)' : ''}`
            : `Lote ${j + 1} - ${baseTitle}`;

          const lotResult = await services.lot.createLot({
              auctionId: auction.id,
              title: lotTitle,
              number: `${j + 1}`.padStart(3, '0'),
              price: lotValue,
              initialPrice: lotInitialPrice,
              status: lotStatus,
              isFeatured,
              assetIds: selectedAssets.map(assetItem => assetItem.id.toString()),
              type: linkedProcessId ? 'JUDICIAL' : 'EXTRAJUDICIAL',
          }, tenantId);

          if (lotResult.success && lotResult.lotId) {
              try {
                  if (linkedProcessId) {
                    await linkLotToJudicialProcess(lotResult.lotId, linkedProcessId);
                  }

                  for (const assetItem of selectedAssets) {
                    await services.asset.updateAsset(assetItem.id.toString(), {
                      status: 'LOTEADO',
                    });
                  }

                  if (faker.datatype.boolean({ probability: 0.3 })) {
                      const winningBidder = faker.helpers.arrayElement(bidderUsers.filter(u => u?.habilitationStatus === 'HABILITADO'));
                      if (winningBidder) {
                          const winDate = faker.date.past();
                          const multiplier = faker.number.int({ min: 90, max: 115 }) / 100;
                          const winningBid = new Decimal(Math.round(lotValue * multiplier));
                          const userWin = await services.userWin.create({
                              lotId: BigInt(lotResult.lotId),
                              userId: BigInt(winningBidder.id),
                              winDate,
                              winningBidAmount: winningBid,
                              paymentStatus: PaymentStatus.PENDENTE,
                              tenantId: 1n
                          });

                          if (userWin) {
                              const installmentCount = faker.number.int({ min: 1, max: Constants.INSTALLMENTS_PER_WIN });
                              const result = await services.installmentPayment.createInstallmentsForWin(
                                  userWin,
                                  installmentCount
                              );
                              if (!result.success) {
                                  console.warn(`Failed to create installments for win ${userWin.id}`);
                              }
                          }
                      }
                  }
              } catch (error: any) {
                  console.warn(`Failed to finalize lot ${lotResult.lotId}: ${error.message}`);
              }
          } else {
              console.warn(`Failed to create lot: ${lotResult.message}`);
              if (linkedProcessId && processAssetPools[linkedProcessId]) {
                processAssetPools[linkedProcessId].push(...selectedAssets);
              } else {
                generalAssetPool.push(...selectedAssets);
              }
          }
      }
  }
  const createdAuctions = await services.auction.getAuctions(1);
  console.log(`${createdAuctions?.length || 0} auctions created with lots.`);

  console.log("Creating auction habilitations...");
  for (const auction of (createdAuctions || []).filter(Boolean)) {
    if (auction!.status === 'ABERTO_PARA_LANCES') {
      const allUsers = await services.user.getUsers();
      const habilitatedBidders = (allUsers || [])
        .filter((u: any) => u?.habilitationStatus === 'HABILITADO')
        .slice(0, 5);
      for (const bidder of habilitatedBidders.filter(Boolean)) {
        if (!bidder) continue;
        try {
          await services.habilitation.upsertAuctionHabilitation({
            user: { connect: { id: BigInt(bidder.id.toString()) } },
            auction: { connect: { id: BigInt(auction!.id.toString()) } },
          });
        } catch (error: any) {
          if (!error.message?.includes('already') && !error.message?.includes('Unique constraint')) {
            console.warn(`Failed to create habilitation: ${error.message}`);
          }
        }
      }
    }
  }
  console.log("Auction habilitations created.");

  console.log("Creating document types...");
  const documentTypes: DocumentType[] = [];
  const docTypeNames = ['CPF', 'RG', 'CNH', 'Comprovante de Residência', 'Comprovante de Renda'];
  for (const docTypeName of docTypeNames) {
    const docType = await services.documentType.upsertDocumentType({
        name: docTypeName,
        description: docTypeName,
        isRequired: ['CPF', 'RG'].includes(docTypeName),
        appliesTo: 'BOTH',
    });
    if (docType) {
      documentTypes.push({ ...docType, id: docType.id.toString() } as DocumentType);
    }
  }
  console.log(`${documentTypes.length} document types created.`);

  console.log("Creating user documents...");
  const userDocuments: any[] = [];
  for (let i = 0; i < Math.min(10, bidderUsers.length); i++) {
    const user = bidderUsers[i];
    const docType = faker.helpers.arrayElement(documentTypes);
    if (user && docType) {
      try {
        const docResult = await services.userDocument.createUserDocument({
          user: { connect: { id: user.id } },
          documentType: { connect: { id: BigInt(docType.id) } },
          status: 'APPROVED',
          fileUrl: faker.image.url(),
          fileName: `doc_${faker.string.numeric(5)}.pdf` // Required file name
        });
        if (docResult.success) userDocuments.push(docResult);
      } catch (error: any) {
        console.warn(`Failed to create user document: ${error.message}`);
      }
    }
  }
  console.log("User documents created.");

  if (lawyerUsers.length > 0 && documentTypes.length > 0) {
    try {
      const lawyerDocType = documentTypes.find(dt => dt.name === 'RG') || documentTypes[0];
      await services.userDocument.createUserDocument({
        user: { connect: { id: BigInt(lawyerUsers[0].id) } },
        documentType: { connect: { id: BigInt(lawyerDocType.id) } },
        status: 'PENDING_ANALYSIS',
        fileUrl: 'https://storage.googleapis.com/bidexpert-demo/juridico/oab-certificado.pdf',
        fileName: 'certificado_oab.pdf'
      });
    } catch (error: any) {
      console.warn('Failed to create lawyer pending document:', error.message || error);
    }
  }

  console.log("Simulating bids, wins, and user interactions...");
  const openAuctions = (await services.auction.getAuctions(tenantId.toString()))?.filter(a => a.status === 'ABERTO_PARA_LANCES') || [];

  for (const auction of openAuctions) {
      const lots = (await services.lot.getLots(tenantId.toString()))?.filter(l => l.auctionId.toString() === auction.id) || [];
      const habilitatedBidders = bidderUsers.filter(u => u?.habilitationStatus === 'HABILITADO' && u);

      for (const lot of lots) {
          const numBids = faker.number.int({ min: 0, max: Constants.BIDS_PER_LOT_MAX });
          let lastBidAmount = new Decimal(lot.price || 0);

          for (let i = 0; i < numBids; i++) {
              const bidder = faker.helpers.arrayElement(habilitatedBidders);
              if (!bidder) continue;

              lastBidAmount = lastBidAmount.plus(new Decimal(lot.bidIncrementStep || 100));
              await services.bid.createBid(
                  {
                    tenant: { connect: { id: BigInt(tenantId) } },
                    lot: { connect: { id: BigInt(lot.id) } },
                    bidder: { connect: { id: bidder.id } },
                    amount: Number(lastBidAmount),
                    auction: { connect: { id: BigInt(auction.id) } },

                  }
              );
          }

          if (numBids > 0 && faker.datatype.boolean({ probability: 0.3 })) {
            const questioner = faker.helpers.arrayElement(habilitatedBidders);
            if (questioner && lot.auctionId) {
              try {
                await services.lotQuestion.create({
                  lotId: lot.id.toString(),
                  userId: questioner.id.toString(),
                  authorName: questioner.fullName || 'Usuário',
                  question: faker.lorem.sentence(),
                });
              } catch (error: any) {
              }
            }
          }

          if (numBids > 0 && faker.datatype.boolean({ probability: 0.2 })) {
            const reviewer = faker.helpers.arrayElement(habilitatedBidders);
            if (reviewer && lot.auctionId) {
              try {
                await services.review.create({
                  lotId: lot.id.toString(),
                  userId: reviewer.id.toString(),
                  authorName: reviewer.fullName || 'Usuário',
                  rating: faker.number.int({ min: 3, max: 5 }),
                  comment: faker.lorem.sentence(),
                });
              } catch (error: any) {
              }
            }
          }

          // Update lot status based on if it received any bids
          try {
            if (lastBidAmount.gt(0)) {
              await services.lot.updateLot(lot.id.toString(), { status: 'VENDIDO' });
            } else {
              await services.lot.updateLot(lot.id.toString(), { status: 'NAO_VENDIDO' });
            }
          } catch (error: any) {
            console.warn(`Failed to update lot status: ${error.message}`);
          }
      }
  }

  console.log("Creating direct sale offers...");
  const offerStatuses: Array<'ACTIVE' | 'PENDING_APPROVAL' | 'SOLD' | 'EXPIRED'> = [
    'ACTIVE', 'PENDING_APPROVAL', 'SOLD', 'EXPIRED'
  ];
  
  // Obter categorias para usar nas ofertas
  const categories = await prisma.lotCategory.findMany({
    take: 5,
    orderBy: { name: 'asc' }
  });

  // Obter vendedores ativos
  const activeSellers = sellers.filter(s => s && s.isActive);
  
  if (activeSellers.length === 0) {
    console.warn("Nenhum vendedor ativo encontrado. Pulando criação de ofertas de venda direta.");
    return;
  }

  for (let i = 0; i < Math.min(Constants.DIRECT_SALE_OFFERS_COUNT, 20); i++) {
    const asset = faker.helpers.arrayElement(assets.filter(a => a?.status === 'DISPONIVEL'));
    const seller = faker.helpers.arrayElement(activeSellers);
    const category = faker.helpers.arrayElement(categories);
    
    if (asset && seller && category) {
      try {
        const basePrice = asset.evaluationValue ? Number(asset.evaluationValue) : faker.number.float({ min: 1000, max: 100000, precision: 2 });
        const status = faker.helpers.arrayElement(offerStatuses);
        const offerType = faker.helpers.arrayElement(['BUY_NOW', 'ACCEPTS_PROPOSALS']);
        
        // Garantir que temos pelo menos uma imagem
        const imageUrls = asset.images?.length > 0 
          ? asset.images 
          : [faker.image.urlLoremFlickr({ category: 'product' })];
        
        const offerData = {
          title: `Oferta Especial - ${asset.title || `Item ${i + 1}`}`,
          description: faker.lorem.paragraphs(3, '\n\n'),
          offerType,
          price: offerType === 'BUY_NOW' ? basePrice : null,
          minimumOfferPrice: offerType === 'ACCEPTS_PROPOSALS' ? basePrice * 0.8 : null, // 20% abaixo do valor base
          status,
          locationCity: asset.city || faker.location.city(),
          locationState: asset.state || faker.location.state({ abbreviated: true }),
          imageUrl: imageUrls[0],
          galleryImageUrls: imageUrls.slice(0, 3),
          expiresAt: faker.date.between({ from: new Date(), to: faker.date.future({ years: 1 }) }),
          categoryId: category.id.toString(),
          sellerId: seller.id.toString(),
          // Campos adicionais para melhor visualização
          dataAiHint: faker.helpers.arrayElement([
            'bem-conservado',
            'pouco-uso',
            'semi-novo',
            'novo-de-tag',
            'exposicao',
            'estoque'
          ])
        };

        // Criar a oferta
        const result = await services.directSaleOffer.createDirectSaleOffer(tenantId.toString(), offerData);
        
        if (result.success) {
          console.log(`✅ Oferta criada: ${offerData.title} (ID: ${result.offerId})`);
          
          // Atualizar status do ativo se a oferta estiver ativa
          if (status === 'ACTIVE' || status === 'SOLD') {
            try {
              await services.asset.updateAsset(asset.id.toString(), { 
                status: status === 'SOLD' ? 'VENDIDO' : 'EM_NEGOCIACAO' 
              });
            } catch (updateError) {
              console.warn(`⚠️ Não foi possível atualizar o status do ativo ${asset.id}:`, updateError.message);
            }
          }
          
          // Adicionar algumas visualizações aleatórias
          if (faker.datatype.boolean({ probability: 0.7 })) { // 70% de chance de ter visualizações
            const viewCount = faker.number.int({ min: 1, max: 50 });
            try {
              await prisma.directSaleOffer.update({
                where: { id: BigInt(result.offerId!) },
                data: { views: viewCount }
              });
              console.log(`   - Adicionadas ${viewCount} visualizações`);
            } catch (viewError) {
              console.warn(`⚠️ Erro ao adicionar visualizações:`, viewError.message);
            }
          }
        } else {
          console.warn(`❌ Falha ao criar oferta: ${result.message}`);
        }
      } catch (error: any) {
        console.error(`❌ Erro ao criar oferta de venda direta: ${error.message}`);
        if (error.stack) {
          console.error(error.stack);
        }
      }
    }
  }
  console.log("Direct sale offers created.");

  console.log("Creating notifications...");
  for (let i = 0; i < 20; i++) {
    const user = faker.helpers.arrayElement(bidderUsers.filter(Boolean));
    if (user) {
      try {
        await services.notification.createNotification({
          tenant: { connect: { id: BigInt(tenantId) } },
          user: { connect: { id: user.id } },
          message: faker.helpers.arrayElement([
            'Seu lance foi superado!',
            'Novo lote disponível para lances',
            'Lote favorito está encerrando em breve',
            'Você ganhou um lote!',
          ]),
          link: '/dashboard',
        });
      } catch (error: any) {
        console.warn(`Failed to create notification: ${error.message}`);
      }
    }
  }
  console.log("Notifications created.");

  console.log("Creating subscribers...");
  for (let i = 0; i < 10; i++) {
    try {
      await services.subscriber.createSubscriber({
        email: faker.internet.email(),
        name: faker.person.fullName(),
      }, tenantId);
    } catch (error: any) {
    }
  }
  console.log("Subscribers created.");

  // Adicionar estágios de leilão para cada leilão
  console.log("Criando estágios de leilão...");
  for (const auction of auctions) {
    if (!auction) continue; // Pular se o leilão for nulo
    
    try {
      const auctionId = auction.id.toString();
      
      // Verificar se já existem estágios para este leilão
      const existingStages = await prisma.auctionStage.findMany({
        where: { auctionId: BigInt(auctionId) }
      });
      
      if (existingStages.length === 0) {
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000; // 1 semana em milissegundos
        
        const auctionStages = [
          {
            name: 'Fase de Lances',
            startDate: new Date(now),
            endDate: new Date(now + oneWeek),
            initialPrice: 0,
            auction: { connect: { id: BigInt(auctionId) } },
            status: 'ABERTO' as const
          },
          {
            name: 'Fase de Julgamento',
            startDate: new Date(now + oneWeek),
            endDate: new Date(now + (2 * oneWeek)),
            initialPrice: 0,
            auction: { connect: { id: BigInt(auctionId) } },
            status: 'AGUARDANDO_INICIO' as const
          },
          {
            name: 'Fase de Pagamento',
            startDate: new Date(now + (2 * oneWeek)),
            endDate: new Date(now + (3 * oneWeek)),
            initialPrice: 0,
            auction: { connect: { id: BigInt(auctionId) } },
            status: 'AGUARDANDO_INICIO' as const
          }
        ];

        for (const stageData of auctionStages) {
          await prisma.auctionStage.create({ 
            data: stageData 
          });
        }
        console.log(`Estágios criados para o leilão ${auctionId}`);
      } else {
        console.log(`Leilão ${auctionId} já possui ${existingStages.length} estágios`);
      }
    } catch (error: any) {
      console.warn(`Erro ao criar estágios para o leilão ${auction.id}: ${error.message}`);
    }
  }
  console.log("Estágios de leilão processados com sucesso!");

  // Processar pagamentos parcelados para arremates
  console.log("Criando métodos de pagamento para os compradores...");
  
  // Criar métodos de pagamento para cada comprador
  for (const bidder of bidderUsers) {
    if (!bidder) continue;
    
    try {
      // Criar um cartão de crédito como método de pagamento padrão
      await services.paymentMethod.createPaymentMethod({
        bidder: { connect: { id: BigInt(bidder.id) } },
        type: 'CREDIT_CARD',
        isDefault: true,
        cardLast4: String(faker.number.int({ min: 1000, max: 9999 })),
        cardBrand: faker.helpers.arrayElement(['VISA', 'MASTERCARD', 'ELO', 'AMEX']),
        cardToken: `tok_${faker.string.alphanumeric(16)}`,
        isActive: true,
        expiresAt: faker.date.future({ years: 3 }),
      });
      
      // Adicionar um segundo método de pagamento (PIX) para alguns compradores
      if (Math.random() > 0.5) {
        await services.paymentMethod.createPaymentMethod({
          bidder: { connect: { id: BigInt(bidder.id) } },
          type: 'PIX',
          isDefault: false,
          pixKey: faker.finance.ethereumAddress(),
          pixKeyType: faker.helpers.arrayElement(['CPF', 'EMAIL', 'PHONE', 'RANDOM']),
          isActive: true,
        });
      }
      
      // Adicionar um terceiro método de pagamento (BOLETO) para alguns compradores
      if (Math.random() > 0.7) {
        await services.paymentMethod.createPaymentMethod({
          bidder: { connect: { id: BigInt(bidder.id) } },
          type: 'BOLETO',
          isDefault: false,
          isActive: true,
        });
      }
      
      console.log(`Métodos de pagamento criados para o comprador ${bidder.id}`);
    } catch (error: any) {
      console.warn(`Erro ao criar métodos de pagamento para o comprador ${bidder.id}: ${error.message}`);
    }
  }
  
  console.log("Processando pagamentos parcelados...");
  
  // Primeiro, obter todos os arremates
  const allUserWins = await prisma.userWin.findMany({
    include: {
      lot: true,
      user: true,
      installmentPayment: true
    }
  });

  // Filtrar apenas arremates sem parcelas
  const userWins = allUserWins.filter(win => {
    return !win.installmentPayment || win.installmentPayment.length === 0;
  });

  console.log(`Encontrados ${userWins.length} arremates sem parcelas`);

  for (const win of userWins) {
    try {
      // Garantir que temos os dados necessários
      if (!win.id || !win.winningBidAmount) {
        console.warn(`Arremate inválido: ${JSON.stringify(win)}`);
        continue;
      }

      const numInstallments = faker.number.int({ min: 1, max: 12 });
      
      // Converter o valor para número, lidando com diferentes tipos
      let winningBidAmount: number;
      if (win.winningBidAmount instanceof Prisma.Decimal) {
        winningBidAmount = win.winningBidAmount.toNumber();
      } else if (typeof win.winningBidAmount === 'bigint') {
        winningBidAmount = Number(win.winningBidAmount);
      } else {
        winningBidAmount = Number(win.winningBidAmount);
      }
      
      // Garantir que temos um valor válido
      if (isNaN(winningBidAmount) || winningBidAmount <= 0) {
        console.warn(`Valor de lance vencedor inválido para arremate ${win.id}: ${win.winningBidAmount}`);
        continue;
      }
      
      console.log(`Criando ${numInstallments} parcelas para o arremate ${win.id} (Valor: ${winningBidAmount})`);
      
      // Calcular valor das parcelas com juros
      const interestRate = 0.015; // 1.5% ao mês
      const totalWithInterest = winningBidAmount * (1 + (interestRate * numInstallments));
      const installmentAmount = totalWithInterest / numInstallments;
      
      // Criar parcelas
      const now = new Date();
      
      for (let i = 1; i <= numInstallments; i++) {
        try {
          const dueDate = new Date(now);
          dueDate.setMonth(now.getMonth() + i);
          
          const paymentData = {
            userWinId: win.id,
            installmentNumber: i,
            totalInstallments: numInstallments,
            amount: new Prisma.Decimal(installmentAmount.toFixed(2)),
            dueDate: dueDate,
            status: 'PENDENTE' as const,
            paymentDate: null as Date | null,
            createdAt: now,
            updatedAt: now
          };
          
          // Criar cada parcela individualmente para melhor controle
          const createdPayment = await prisma.installmentPayment.create({
            data: paymentData
          });
          
          console.log(`Criada parcela ${i}/${numInstallments} para o arremate ${win.id}`);
          
          // 70% de chance de marcar como paga
          if (faker.datatype.boolean(0.7)) {
            await prisma.installmentPayment.update({
              where: { id: createdPayment.id },
              data: { 
                status: 'PAGO' as const,
                paymentDate: new Date()
              }
            });
            console.log(`Parcela ${i} marcada como PAGA`);
          }
        } catch (paymentError: any) {
          console.error(`Erro ao criar parcela ${i} para arremate ${win.id}:`, paymentError.message);
        }
      }
    } catch (error: any) {
      console.warn(`Erro ao processar pagamentos para arremate ${win.id}: ${error.message}`);
      if (error.stack) {
        console.error(error.stack);
      }
    }
  }
  console.log("Processamento de pagamentos concluído!");

  console.log("--- SEED SCRIPT V3.0 FINISHED SUCCESSFULLY ---");
  console.log(`
📊 RESUMO DO SEED:`);
  console.log(`✅ ${Object.keys(createdRoles).length} Roles`);
  console.log(`✅ ${Object.keys(createdStates).length} Estados`);
  console.log(`✅ ${cities.length} Cidades`);
  console.log(`✅ ${courts.length} Tribunais`);
  console.log(`✅ ${districts.length} Comarcas`);
  console.log(`✅ ${branches.length} Varas`);
  console.log(`✅ ${judicialProcesses.length} Processos Judiciais`);
  console.log(`✅ ${auctioneers.length} Leiloeiros`);
  console.log(`✅ ${sellers.length} Comitentes`);
  console.log(`✅ ${vehicleMakes.length} Marcas de Veículos`);
  console.log(`✅ ${vehicleModels.length} Modelos de Veículos`);
  console.log(`✅ ${mediaItems.length} Itens de Mídia`);
  console.log(`✅ ${assets.length} Ativos`);
  console.log(`✅ ${auctions.length} Leilões`);
  console.log(`✅ ${bidderUsers.length} Arrematantes`);
  console.log(`✅ ${documentTypes.length} Tipos de Documento`);

  // Criar configurações de mental triggers
  await createMentalTriggerSettings(tenantId);
}

/**
 * Cria as configurações de mental triggers para o tenant
 * @param tenantId ID do tenant
 */
async function createMentalTriggerSettings(tenantId: string) {
  console.log("\nCriando configurações de mental triggers...");
  
  try {
    // Primeiro, obter ou criar as configurações da plataforma para o tenant
    const platformSettings = await prisma.platformSettings.upsert({
      where: { tenantId: BigInt(tenantId) },
      update: {},
      create: {
        tenantId: BigInt(tenantId),
        isSetupComplete: true,
        // Apenas campos que existem no modelo PlatformSettings
      }
    });
    
    console.log(`✅ Configurações da plataforma obtidas/criadas para o tenant ${tenantId}`);
    
    // Verificar se já existem configurações de mental triggers para este tenant
    const existingSettings = await prisma.mentalTriggerSettings.findUnique({
      where: { platformSettingsId: platformSettings.id }
    });
    
    if (existingSettings) {
      console.log("✅ Configurações de mental triggers já existem, atualizando...");
      
      // Atualizar as configurações existentes
      await prisma.mentalTriggerSettings.update({
        where: { id: existingSettings.id },
        data: {
          showDiscountBadge: true,
          showPopularityBadge: true,
          popularityViewThreshold: 100,
          showHotBidBadge: true,
          hotBidThreshold: 10,
          showExclusiveBadge: true,
        }
      });
      
      console.log("✅ Configurações de mental triggers atualizadas com sucesso");
    } else {
      console.log("✅ Criando novas configurações de mental triggers...");
      
      // Criar novas configurações
      await prisma.mentalTriggerSettings.create({
        data: {
          platformSettingsId: platformSettings.id,
          showDiscountBadge: true,
          showPopularityBadge: true,
          popularityViewThreshold: 100,
          showHotBidBadge: true,
          hotBidThreshold: 10,
          showExclusiveBadge: true,
        }
      });
      
      console.log("✅ Configurações de mental triggers criadas com sucesso");
    }
    
  } catch (error) {
    console.error("Erro ao configurar mental triggers:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("--- SEED SCRIPT V3.0 FAILED ---");
    console.error(e);
    process.exit(1);
  })
    .finally(async () => {
        // Services handle their own disconnections
        console.log("Seed process completed");
    });