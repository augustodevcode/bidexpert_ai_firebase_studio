import { faker } from '@faker-js/faker';
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
import { AuctionStageService } from '../src/services/auction-stage.service';
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
import type { Role, AssetFormData, AuctionStatus, LotStatus, Auction, Lot, JudicialDistrict, JudicialBranch, Court, CityInfo as City, JudicialProcessFormData, UserWin, DocumentType, VehicleMake, VehicleModel, MediaItem } from '../src/types';

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
    auctionStage: new AuctionStageService(),
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
    COURT_COUNT: 5,
    JUDICIAL_DISTRICT_COUNT: 10,
    JUDICIAL_BRANCH_COUNT: 15,
    JUDICIAL_PROCESS_COUNT: 8,
    CITY_COUNT: 10,
    VEHICLE_MAKE_COUNT: 10,
    VEHICLE_MODEL_COUNT: 30,
    MEDIA_ITEM_COUNT: 50,
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
        } catch (error: any) {
            console.warn(`Could not clean ${modelName}:`, (error as Error).message);
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
  
  // Garantir que os IDs dos roles sejam strings para uso posterior
  Object.keys(createdRoles).forEach(key => {
    if (createdRoles[key] && typeof createdRoles[key].id !== 'string') {
      createdRoles[key] = { ...createdRoles[key], id: String(createdRoles[key].id) };
    }
  });

  const landlordTenant = await prisma.tenant.upsert({
    where: { id: 1n },
    update: { },
    create: { id: 1n, name: 'Landlord', subdomain: 'www', domain: 'bidexpert.com.br' },
  });
  const tenantId = landlordTenant.id.toString();

  await prisma.platformSettings.upsert({
    where: { tenantId: BigInt(tenantId) },
    update: { },
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
        ],
      } as JudicialProcessFormData);
      if (processResult.success && processResult.processId) {
        const process = await services.judicialProcess.getJudicialProcessById(tenantId, processResult.processId);
        if (process) judicialProcesses.push(process);
      }
    }
  }
  console.log(`${judicialProcesses.length} judicial processes created.`);


  console.log("Creating media items...");
  const mediaItems: any[] = [];
  if (adminUser) {
    for (let i = 0; i < Constants.MEDIA_ITEM_COUNT; i++) {
      const mediaResult = await services.mediaItem.createMediaItem({
        userId: adminUser.id.toString(),
        fileName: `image-${i + 1}.jpg`,
        storagePath: `images/image-${i + 1}.jpg`,
        sizeBytes: faker.number.int({ min: 100000, max: 5000000 }),
        urlOriginal: `https://picsum.photos/seed/${i}/800/600`,
        mimeType: 'image/jpeg',
      });
      if (mediaResult.success && mediaResult.mediaItem) {
        mediaItems.push(mediaResult.mediaItem);
      }
    }
  }
  console.log(`${mediaItems.length} media items created.`);

  console.log("Creating assets...");
  const assets: any[] = [];
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
      assets.push(await services.asset.getAssetById(tenantId, assetResult.assetId));
  }
  console.log(`${assets.length} assets created.`);


  console.log("Creating auctions and lots...");
  const auctions: (Auction | null)[] = [];
  let availableAssets = faker.helpers.shuffle(assets.filter(a => a?.status === 'DISPONIVEL'));

  for (let i = 0; i < Constants.AUCTION_COUNT; i++) {
      const auctioneer = faker.helpers.arrayElement(auctioneers.filter(Boolean));
      const seller = faker.helpers.arrayElement(sellers.filter(Boolean));
      if (!auctioneer || !seller) continue;

      const status = faker.helpers.arrayElement<AuctionStatus>(['ABERTO_PARA_LANCES', 'EM_BREVE', 'FINALIZADO', 'CANCELADO']);

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
            auction: { connect: { id: auction.id } },
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
          if (availableAssets.length === 0) continue;

          const asset = availableAssets.pop();
          if (!asset) continue;

          const lotResult = await services.lot.createLot({
              auctionId: auction.id.toString(),
              title: `Lote ${j + 1} - ${asset.title}`,
              number: `${j + 1}`.padStart(3, '0'),
              price: asset.evaluationValue as number,
              assetIds: [asset.id.toString()],
              type: 'EXTRAJUDICIAL',
          }, tenantId);

          if (lotResult.success && lotResult.lotId) {
              try {
                  await services.asset.updateAsset(tenantId, asset.id.toString(), { status: 'EM_LOTE' });
              } catch (error: any) {
                  console.warn(`Failed to update asset ${asset.id} status: ${error.message}`);
              }
          } else {
              console.warn(`Failed to create lot: ${lotResult.message}`);
              availableAssets.push(asset);
          }
      }
  }
  console.log(`${auctions.length} auctions created with lots.`);


  console.log("Creating auction habilitations...");
  for (const auction of auctions.filter(Boolean)) {
    if (auction!.status === 'ABERTO_PARA_LANCES') {
      const habilitatedBidders = bidderUsers.filter(u => u?.habilitationStatus === 'HABILITADO').slice(0, 5);
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
      documentTypes.push(docType);
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
        const docResult = await services.userDocument.create({
          user: { connect: { id: user.id } },
          documentType: { connect: { id: docType.id.toString() } },
          status: 'APPROVED',
          documentNumber: faker.string.numeric(11),
        });
        if (docResult.success) userDocuments.push(docResult);
      } catch (error: any) {
        console.warn(`Failed to create user document: ${error.message}`);
      }
    }
  }
  console.log("User documents created.");

  console.log("Simulating bids, wins, and user interactions...");
  const openAuctions = (await services.auction.getAuctions({ where: { status: 'ABERTO_PARA_LANCES' } })) || [];

  for (const auction of openAuctions) {
      const lots = await services.lot.getLotsByAuctionId(auction.id.toString());
      const habilitatedBidders = bidderUsers.filter(u => u?.habilitationStatus === 'HABILITADO' && u);

      for (const lot of lots) {
          const numBids = faker.number.int({ min: 0, max: Constants.BIDS_PER_LOT_MAX });
          let lastBidAmount = new Decimal(lot.price || 0);

          for (let i = 0; i < numBids; i++) {
              const bidder = faker.helpers.arrayElement(habilitatedBidders);
              if (!bidder) continue;

              lastBidAmount = lastBidAmount.plus(new Decimal(lot.bidIncrementStep || 100));
              await services.bid.create(
                  {
                    lot: { connect: { id: lot.id } },
                    bidder: { connect: { id: bidder.id } },
                    amount: Number(lastBidAmount),
                    auction: { connect: { id: auction.id } },
                    authorName: bidder.fullName || undefined
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

          if (numBids > 0) {
              const winningBid = await services.bid.getHighestBid(lot.id.toString());
              if (winningBid) {
                  const userWinResult = await services.userWin.create(
                    {
                      lotId: lot.id.toString(),
                      winnerId: winningBid.bidderId.toString(),
                      value: new Decimal(winningBid.amount),
                      status: 'PENDENTE'
                    }
                  );
                  if (userWinResult.success && userWinResult.userWin) {
                      await services.installmentPayment.createInstallmentsForWin(userWinResult.userWin as UserWin, faker.helpers.arrayElement([1, 3, 6]));
                  }
                  await services.lot.updateLot(tenantId, lot.id.toString(), { 
                      status: 'VENDIDO', 
                      winnerId: winningBid.bidderId.toString() 
                  });
              }
          } else {
               await services.lot.updateLot(tenantId, lot.id.toString(), { status: 'NAO_VENDIDO' });
          }
      }
  }
  console.log("Bidding and win simulation complete.");

  console.log("Creating direct sale offers...");
  for (let i = 0; i < 5; i++) {
    const asset = faker.helpers.arrayElement(assets.filter(a => a?.status === 'DISPONIVEL'));
    const seller = faker.helpers.arrayElement(sellers.filter(Boolean));
    if (asset && seller) {
      try {
        await services.directSaleOffer.createDirectSaleOffer(tenantId, {
          assetId: asset.id.toString(),
          sellerId: seller.id.toString(),
          price: asset.evaluationValue as number,
          status: 'ATIVO',
        });
      } catch (error: any) {
        console.warn(`Failed to create direct sale offer: ${error.message}`);
      }
    }
  }
  console.log("Direct sale offers created.");

  console.log("Creating notifications...");
  for (let i = 0; i < 20; i++) {
    const user = faker.helpers.arrayElement(bidderUsers.filter(Boolean));
    if (user) {
      try {
        await services.notification.create({
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
