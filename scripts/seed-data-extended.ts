// scripts/seed-data-extended.ts
/**
 * @fileoverview Script de seed completo e robusto para a plataforma BidExpert.
 * Popula TODAS as tabelas do banco de dados com dados consistentes e interligados,
 * utilizando os SERVIÇOS da aplicação para garantir que todas as regras de negócio
 * e validações sejam aplicadas, resultando em um banco de dados idêntico ao que
 * seria gerado pela interação real com a UI.
 *
 * Para executar: `npx tsx scripts/seed-data-extended.ts`
 */
import { PrismaClient, Prisma, UserHabilitationStatus, AssetStatus, AuctionStatus, AuctionType, AuctionMethod, AuctionParticipation, ProcessPartyType, LotStatus, PaymentStatus, DirectSaleOfferStatus, DirectSaleOfferType } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';

// Importa os serviços reais da aplicação
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
import { AuctionStageService } from '../src/services/auction-stage.service';
import { BidService } from '../src/services/bid.service';
import { UserWinService } from '../src/services/user-win.service';
import { InstallmentPaymentService } from '../src/services/installment-payment.service';
import { LotQuestionService } from '../src/services/lot-question.service';
import { ReviewService } from '../src/services/review.service';
import { DirectSaleOfferService } from '../src/services/direct-sale-offer.service';
import { NotificationService } from '../src/services/notification.service';
import { ContactMessageService } from '../src/services/contact-message.service';
import { DocumentTemplateService } from '../src/services/document-template.service';
import { SubscriberService } from '../src/services/subscriber.service';
import { UserLotMaxBidService } from '../src/services/user-lot-max-bid.service';
import { DataSourceService } from '../src/services/data-source.service';


const prisma = new PrismaClient();

// --- Funções Utilitárias ---
const log = (message: string, level = 0) => {
  console.log(`${'  '.repeat(level)}- ${message}`);
};

const randomEnum = <T extends object>(e: T): T[keyof T] => {
  const values = Object.values(e);
  return values[Math.floor(Math.random() * values.length)] as T[keyof T];
};

const slugify = (text: string) => {
  if (!text) return '';
  return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-');
};

// --- Armazenamento de Entidades Criadas ---
const entityStore: {
  tenantId: string;
  roles: Record<string, bigint>;
  users: (Prisma.UserGetPayload<{}> & { roleNames: string[], id: bigint })[];
  categories: (Prisma.LotCategoryGetPayload<{ include: { subcategories: true }, where: { id: bigint } }>)[];
  states: Prisma.StateGetPayload<{ where: {id: bigint}}>[];
  cities: Prisma.CityGetPayload<{ where: {id: bigint}}>[];
  courts: Prisma.CourtGetPayload<{where: {id: bigint}}>[];
  judicialDistricts: Prisma.JudicialDistrictGetPayload<{where: {id: bigint}}>[];
  judicialBranches: Prisma.JudicialBranchGetPayload<{where: {id: bigint}}>[];
  sellers: Prisma.SellerGetPayload<{where: {id: bigint}}>[];
  auctioneers: Prisma.AuctioneerGetPayload<{where: {id: bigint}}>[];
  judicialProcesses: Prisma.JudicialProcessGetPayload<{where: {id: bigint}}>[];
  assets: Prisma.AssetGetPayload<{where: {id: bigint}}>[];
  auctions: (Prisma.AuctionGetPayload<{ include: { stages: true } } & {id: bigint}>)[];
  lots: Prisma.LotGetPayload<{where: {id: bigint}}>[];
  mediaItems: Prisma.MediaItemGetPayload<{where: {id: bigint}}>[];
  documentTypes: Record<string, bigint>;
  userWins: Prisma.UserWinGetPayload<{where: {id: bigint}}>[];
  vehicleMakes: Prisma.VehicleMakeGetPayload<{where: {id: bigint}}>[];
  vehicleModels: Prisma.VehicleModelGetPayload<{where: {id: bigint}}>[];
} = {
  tenantId: '1',
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

// --- Instâncias dos Serviços ---
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
  auctionStage: new AuctionStageService(),
  bid: new BidService(),
  userWin: new UserWinService(),
  installmentPayment: new InstallmentPaymentService(),
  lotQuestion: new LotQuestionService(),
  review: new ReviewService(),
  directSaleOffer: new DirectSaleOfferService(),
  notification: new NotificationService(),
  contactMessage: new ContactMessageService(),
  documentTemplate: new DocumentTemplateService(),
  subscriber: new SubscriberService(),
  userLotMaxBid: new UserLotMaxBidService(),
  dataSource: new DataSourceService(),
};

// --- Constantes de Geração ---
const TOTAL_USERS = 30;
const TOTAL_SELLERS = 15;
const TOTAL_AUCTIONEERS = 5;
const TOTAL_ASSETS = 150;
const TOTAL_AUCTIONS = 25;
const MAX_LOTS_PER_AUCTION = 15;
const MAX_ASSETS_PER_LOT = 5;
const MAX_BIDS_PER_LOT = 50;
const IMAGE_PLACEHOLDER_DIR = path.join(process.cwd(), 'public/uploads/sample-images');

// --- Lógica Principal de Seeding ---

async function runStep(stepFunction: () => Promise<any>, stepName: string) {
  try {
    await stepFunction();
  } catch (error) {
    console.error(`\n❌ Erro na etapa: ${stepName}`);
    throw error;
  }
}

async function main() {
  console.log('🚀 Iniciando o seed completo e robusto do banco de dados...');
  console.log('=====================================================');

  try {
    await prisma.$connect(); // Explicitly connect
    await runStep(cleanupPreviousData, 'Limpeza de dados antigos');
    await runStep(seedCoreInfra, 'Infraestrutura Core');
    await runStep(seedMedia, 'Mídia');
    await runStep(seedCategoriesAndVehicles, 'Categorias e Veículos');
    await runStep(seedLocations, 'Localizações');
    await runStep(seedJudicialInfra, 'Infraestrutura Judicial');
    await runStep(seedParticipants, 'Participantes');
    await runStep(seedAssets, 'Ativos (Bens)');
    await runStep(seedAuctionsAndLots, 'Leilões e Lotes');
    await runStep(seedInteractions, 'Interações');
    await runStep(seedPostAuctionInteractions, 'Interações Pós-Leilão');
    await runStep(seedDirectSaleOffers, 'Ofertas de Venda Direta');
    await runStep(seedMiscData, 'Dados Diversos');

    console.log('\n=====================================================');
    console.log('✅ Seed do banco de dados finalizado com sucesso!');
    console.log('=====================================================');
    await logSummary();
    
    console.log('\n🎉 Dataset completo gerado com sucesso!');
  } catch (error) {
    console.error('\n❌ Ocorreu um erro catastrófico durante o processo de seeding:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanupPreviousData() {
    log('Fase 0: Limpando dados antigos...', 0);
    // A ordem de exclusão é crucial para evitar erros de constraint de chave estrangeira.
    
    await services.installmentPayment.deleteMany({});
    await services.userWin.deleteAllUserWins();
    await services.bid.deleteMany({});
    await services.userLotMaxBid.deleteMany({});
    await services.lotQuestion.deleteMany({});
    await services.review.deleteMany({});
    await services.notification.deleteMany({});
    await services.contactMessage.deleteAllContactMessages();
    await services.subscriber.deleteMany({});
    await prisma.auctionHabilitation.deleteMany({});

    await services.asset.deleteManyAssetsOnLots({});
    await services.document.deleteAllUserDocuments();
    await services.auctionStage.deleteMany({});
    
    await prisma.lot.deleteMany({});
    await prisma.auction.deleteMany({});
    
    await prisma.asset.deleteMany({});
    await prisma.directSaleOffer.deleteMany({});

    await prisma.judicialProcess.deleteMany({});
    await prisma.seller.deleteMany({});
    await prisma.auctioneer.deleteMany({});
    
    await prisma.usersOnRoles.deleteMany({});
    await prisma.usersOnTenants.deleteMany({});
    await services.user.deleteAllUsers();
    
    await prisma.platformSettings.deleteMany({});
    
    await services.vehicleModel.deleteMany({});
    await services.vehicleMake.deleteMany({});
    await services.subcategory.deleteAllSubcategories();
    await services.category.deleteAllCategories();
    await services.judicialBranch.deleteAllJudicialBranches();
    await services.judicialDistrict.deleteAllJudicialDistricts();
    await services.court.deleteAllCourts();
    await services.media.deleteAllMediaItems();
    await services.documentTemplate.deleteAllDocumentTemplates();
    await prisma.documentType.deleteMany({});
    await services.dataSource.deleteAllDataSources();
    await services.city.deleteAllCities();
    await services.state.deleteAllStates();
    await prisma.report.deleteMany({});
    
    // Tenants should be deleted last
    await services.tenant.deleteMany({ where: { id: { not: BigInt(1) } } }); 

    log('Todos os dados antigos foram limpos.', 1);
}

async function seedCoreInfra() {
  log('Fase 1: Infraestrutura Core (Tenant, Roles, Admin, Configs)...', 0);

  const tenantResult = await services.tenant.createTenant({ name: 'BidExpert Platform', subdomain: 'bidexpert' });
  if (!tenantResult.success || !tenantResult.tenant) throw new Error(tenantResult.message);
  entityStore.tenantId = tenantResult.tenant.id.toString();
  log(`Tenant "${tenantResult.tenant.name}" criado.`, 1);

  await services.platformSettings.updateSettings(entityStore.tenantId, {
    siteTitle: 'BidExpert',
    siteTagline: 'Sua plataforma de leilões online.',
    isSetupComplete: true,
  });
  log('Configurações padrão da plataforma criadas/atualizadas.', 1);
  
  const roleNames = ['ADMIN', 'USER', 'BIDDER', 'SELLER_ADMIN', 'AUCTIONEER_ADMIN', 'FINANCIAL', 'CONSIGNOR', 'AUCTIONEER'];
  const allRoles = await prisma.role.findMany();
  const roleMap = new Map<string, bigint>(allRoles.map(r => [r.nameNormalized, r.id]));

  for (const name of roleNames) {
    if (!roleMap.has(name)) {
      const role = await services.role.findOrCreateRole({ name, nameNormalized: name, description: `Perfil ${name}` });
      roleMap.set(name, role.id);
    }
  }
  entityStore.roles = Object.fromEntries(roleMap);
  log(`${roleNames.length} perfis (Roles) garantidos.`, 1);

  const usersToSeed = [
    { email: 'admin@bidexpert.com.br', password: 'Admin@123', fullName: 'Administrador Global', roleNames: ['ADMIN', 'USER'], habilitationStatus: UserHabilitationStatus.HABILITADO },
    { email: 'bidder@bidexpert.com.br', password: 'senha@123', fullName: 'Arrematante de Teste', roleNames: ['BIDDER', 'USER'], habilitationStatus: UserHabilitationStatus.HABILITADO },
    { email: 'comit@bidexpert.com.br', password: 'senha@123', fullName: 'Comitente de Teste', roleNames: ['CONSIGNOR', 'USER'], habilitationStatus: UserHabilitationStatus.HABILITADO },
    { email: 'leilo@bidexpert.com.br', password: 'senha@123', fullName: 'Leiloeiro de Teste', roleNames: ['AUCTIONEER', 'USER'], habilitationStatus: UserHabilitationStatus.HABILITADO },
  ];

  for (const userData of usersToSeed) {
    const roleIds = userData.roleNames.map(rn => entityStore.roles[rn]).filter(Boolean);
    if (roleIds.length !== userData.roleNames.length) {
        throw new Error(`Um ou mais perfis para o usuário ${userData.email} não foram encontrados.`);
    }

    const userResult = await services.user.createUser({
      email: userData.email,
      password: userData.password,
      fullName: userData.fullName,
      habilitationStatus: userData.habilitationStatus,
      accountType: 'PHYSICAL',
      roleIds: roleIds.map(id => id.toString()),
      tenantId: entityStore.tenantId,
    });

    if (!userResult.success || !userResult.userId) {
        const existing = await services.user.findUserByEmail(userData.email);
        if (existing) {
            log(`Usuário ${userData.email} já existe. Ignorando criação.`, 2);
            entityStore.users.push({ ...existing, id: BigInt(existing.id), roleNames: userData.roleNames } as any);
        } else {
             throw new Error(`Falha ao criar usuário ${userData.email}: ${userResult.message}`);
        }
    } else {
        const user = await services.user.getUserById(userResult.userId!);
        if (!user) throw new Error('Falha ao buscar usuário recém-criado.');
        entityStore.users.push({ ...user, id: BigInt(user.id), roleNames: userData.roleNames } as any);
        log(`Usuário ${userData.roleNames.join(', ')} criado: ${user.email}`, 1);
    }
  }

  const docTypes = [
    { name: 'CPF', description: 'Cadastro de Pessoa Física', isRequired: true, appliesTo: 'PHYSICAL,ALL' },
    { name: 'RG', description: 'Registro Geral', isRequired: true, appliesTo: 'PHYSICAL,ALL' },
    { name: 'Comprovante de Residência', description: 'Comprovante de endereço', isRequired: true, appliesTo: 'PHYSICAL,LEGAL,ALL' },
    { name: 'CNPJ', description: 'Cadastro Nacional de Pessoa Jurídica', isRequired: true, appliesTo: 'LEGAL,ALL' },
    { name: 'Contrato Social', description: 'Contrato social da empresa', isRequired: true, appliesTo: 'LEGAL,ALL' },
  ];
  for (const docType of docTypes) {
    const created = await services.documentType.upsertDocumentType(docType as any);
    entityStore.documentTypes[docType.name] = created.id;
  }
  log(`${docTypes.length} tipos de documento garantidos.`, 1);
}

async function seedMedia() {
    log('Fase 2: Mídia (Imagens de Exemplo)...', 0);
    if (!fs.existsSync(IMAGE_PLACEHOLDER_DIR)) {
        log(`Diretório de imagens de exemplo não encontrado em ${IMAGE_PLACEHOLDER_DIR}. Pulando.`, 1);
        return;
    }
    const imageFiles = fs.readdirSync(IMAGE_PLACEHOLDER_DIR).filter(f => f.match(/\.(jpg|jpeg|png|webp)$/));
    const adminUserId = entityStore.users[0].id.toString();
    for (const fileName of imageFiles) {
        const url = `/uploads/sample-images/${fileName}`;
        const mediaResult = await services.media.createMediaItem(
            {
                fileName: fileName,
                mimeType: `image/${path.extname(fileName).substring(1)}`,
                storagePath: url,
                title: faker.commerce.productName(),
            },
            url, 
            adminUserId
        );
        if (mediaResult.success && mediaResult.item) {
            entityStore.mediaItems.push(mediaResult.item as any);
        }
    }
    log(`${entityStore.mediaItems.length} itens de mídia criados.`, 1);
    if (entityStore.mediaItems.length === 0) {
        log("AVISO: Nenhuma imagem de exemplo foi carregada. O seed continuará, mas as entidades não terão imagens.", 1);
    }
}

async function seedCategoriesAndVehicles() {
    log('Fase 3: Categorias, Subcategorias e Veículos...', 0);
    const categoryData: Record<string, string[]> = {
      'Imóveis': ['Apartamentos', 'Casas', 'Terrenos', 'Salas Comerciais'],
      'Veículos': ['Carros', 'Motos', 'Caminhões', 'Ônibus'],
      'Eletrônicos': ['Celulares', 'Notebooks', 'TVs', 'Câmeras'],
      'Arte e Antiguidades': ['Pinturas', 'Esculturas', 'Móveis Antigos'],
      'Maquinário Industrial': ['Tornos', 'Prensas', 'Geradores'],
    };

    for (const catName in categoryData) {
        const catResult = await services.category.createCategory({ name: catName, description: `Categoria de ${catName}` });
        if (catResult.success && catResult.category) {
            for (const subcatName of categoryData[catName]) {
                await services.subcategory.createSubcategory({ 
                    name: subcatName, 
                    parentCategoryId: catResult.category.id.toString(),
                    description: `Subcategoria de ${subcatName}`,
                });
            }
            const fullCategory = await prisma.lotCategory.findUnique({ where: { id: catResult.category.id }, include: { subcategories: true } });
            if (fullCategory) entityStore.categories.push(fullCategory);
        }
    }
    log(`${entityStore.categories.length} categorias e suas subcategorias foram criadas.`, 1);

    const vehicleData: Record<string, string[]> = {
      "Toyota": ["Corolla", "Camry", "RAV4", "Hilux", "Yaris"],
      "Honda": ["Civic", "CR-V", "HR-V", "Fit", "City"],
      "Ford": ["Focus", "Fiesta", "Fusion", "EcoSport", "Ranger"],
      "Chevrolet": ["Onix", "Tracker", "S10", "Cruze", "Spin"],
      "Volkswagen": ["Gol", "Polo", "Jetta", "Tiguan", "Saveiro"],
    };
    
    for (const makeName in vehicleData) {
        const makeResult = await services.vehicleMake.createVehicleMake({ name: makeName });
        if (makeResult.success && makeResult.makeId) {
            const make = await prisma.vehicleMake.findUnique({ where: { id: BigInt(makeResult.makeId) } });
            if (make) {
                entityStore.vehicleMakes.push(make);
                const models = vehicleData[makeName];
                for (const modelName of models) {
                    await services.vehicleModel.createVehicleModel({ name: modelName, makeId: makeResult.makeId });
                }
            }
        }
    }
    log(`${entityStore.vehicleMakes.length} marcas e modelos de veículos criados.`, 1);
}

async function seedLocations() {
    log('Fase 4: Localizações (Estados e Cidades)...', 0);
    const locations = [
      { "nome": "São Paulo", "sigla": "SP", "cidades": [ "São Paulo", "Guarulhos", "Campinas" ] },
      { "nome": "Rio de Janeiro", "sigla": "RJ", "cidades": [ "Rio de Janeiro", "São Gonçalo", "Duque de Caxias" ] },
      { "nome": "Minas Gerais", "sigla": "MG", "cidades": [ "Belo Horizonte", "Uberlândia", "Contagem" ] }
    ];
    
    for (const stateData of locations) {
        const stateResult = await services.state.createState({ name: stateData.nome, uf: stateData.sigla });
        if (stateResult.success && stateResult.stateId) {
            const createdState = await prisma.state.findUnique({ where: { id: BigInt(stateResult.stateId) } });
            if (createdState) {
                entityStore.states.push(createdState);
                for (const cityName of stateData.cidades) {
                    const cityResult = await services.city.createCity({ name: cityName, stateId: createdState.id.toString() });
                    if(cityResult.success && cityResult.cityId) {
                        const city = await prisma.city.findUnique({ where: { id: BigInt(cityResult.cityId) } });
                        if (city) entityStore.cities.push(city);
                    }
                }
            }
        }
    }
    log(`${entityStore.states.length} estados e ${entityStore.cities.length} cidades criados.`, 1);
}

async function seedJudicialInfra() {
    log('Fase 5: Infraestrutura Judicial (Tribunais, Comarcas, Varas)...', 0);
    
    for (let i = 0; i < 5; i++) {
        const state = faker.helpers.arrayElement(entityStore.states);
        const courtResult = await services.court.createCourt({ name: `Tribunal de Justiça de ${state.name}`, stateUf: state.uf });
        if (courtResult.success && courtResult.courtId) {
            const court = await prisma.court.findUnique({ where: { id: BigInt(courtResult.courtId) } });
            if (court) entityStore.courts.push(court);
        }
    }
    log(`${entityStore.courts.length} tribunais criados.`, 1);

    for (let i = 0; i < 10; i++) {
        const court = faker.helpers.arrayElement(entityStore.courts);
        const state = entityStore.states.find(s => s.uf === court.stateUf);
        if(state) {
            const districtResult = await services.judicialDistrict.createJudicialDistrict({
                name: `Comarca de ${faker.location.city()}`, courtId: court.id.toString(), stateId: state.id.toString()
            });
            if (districtResult.success && districtResult.districtId) {
                const district = await prisma.judicialDistrict.findUnique({ where: { id: BigInt(districtResult.districtId) } });
                if (district) entityStore.judicialDistricts.push(district);
            }
        }
    }
    log(`${entityStore.judicialDistricts.length} comarcas criadas.`, 1);

    for (let i = 0; i < 20; i++) {
        const district = faker.helpers.arrayElement(entityStore.judicialDistricts);
        const branchResult = await services.judicialBranch.createJudicialBranch({
            name: `${i + 1}ª Vara Cível`, districtId: district.id.toString()
        });
        if (branchResult.success && branchResult.branchId) {
            const branch = await prisma.judicialBranch.findUnique({ where: { id: BigInt(branchResult.branchId) } });
            if (branch) entityStore.judicialBranches.push(branch);
        }
    }
    log(`${entityStore.judicialBranches.length} varas criadas.`, 1);
}

async function seedParticipants() {
    log('Fase 6: Participantes (Leiloeiros, Vendedores, Arrematantes)...', 0);
    
    for (let i = 0; i < TOTAL_AUCTIONEERS; i++) {
        await services.auctioneer.createAuctioneer(entityStore.tenantId, { name: `Leiloeiro Oficial ${i + 1}`, email: faker.internet.email() } as any);
    }
    entityStore.auctioneers = await services.auctioneer.getAuctioneers(entityStore.tenantId);
    log(`${entityStore.auctioneers.length} leiloeiros criados.`, 1);

    for (let i = 0; i < TOTAL_SELLERS; i++) {
        const isJudicial = i % 4 === 0 && entityStore.judicialBranches.length > 0;
        await services.seller.createSeller(entityStore.tenantId, {
            name: isJudicial ? faker.helpers.arrayElement(entityStore.judicialBranches).name : faker.company.name(),
            isJudicial,
            judicialBranchId: isJudicial ? faker.helpers.arrayElement(entityStore.judicialBranches).id.toString() : undefined,
        } as any);
    }
    entityStore.sellers = await services.seller.getSellers(entityStore.tenantId);
    log(`${entityStore.sellers.length} vendedores criados.`, 1);
    
    await seedJudicialProcesses();

    const userStatuses = Object.values(UserHabilitationStatus);
    for (let i = 0; i < TOTAL_USERS; i++) {
        const email = `arrematante${i}@bidexpert.com`;
        const habilitationStatus = userStatuses[i % userStatuses.length];
        const accountType = i % 3 === 0 ? 'LEGAL' : 'PHYSICAL';
        await services.user.createUser({
            email, password: 'bidder123', fullName: faker.person.fullName(), habilitationStatus, accountType,
            roleIds: [entityStore.roles.BIDDER.toString(), entityStore.roles.USER.toString()],
            tenantId: entityStore.tenantId,
        });
    }
    const allUsers = await services.user.getUsers();
    entityStore.users = [...entityStore.users, ...allUsers.filter(u => u.email.startsWith('arrematante')).map(u => ({...u, id: BigInt(u.id)}))] as any[];
    log(`${TOTAL_USERS} usuários (arrematantes) criados.`, 1);
    await seedUserDocuments();
}

async function seedUserDocuments() {
    log('Fase 6a: Documentos dos Usuários...', 0);
    let count = 0;
    const usersForDocs = entityStore.users.filter(u => u.roleNames.includes('BIDDER'));

    for (const user of usersForDocs) {
        const requiredDocs = Object.keys(entityStore.documentTypes);
        for (const docName of requiredDocs) {
            if (faker.datatype.boolean(0.7)) {
                await services.document.saveUserDocument(
                    user.id.toString(),
                    entityStore.documentTypes[docName].toString(),
                    faker.internet.url(),
                    `${slugify(docName)}-${user.id}.pdf`,
                );
                count++;
            }
        }
    }
    log(`${count} documentos de usuários criados.`, 1);
}

async function seedJudicialProcesses() {
    log('Fase 6b: Processos Judiciais...', 0);
    const judicialSellers = entityStore.sellers.filter(s => s.isJudicial);
    if (judicialSellers.length === 0) return;

    for (const seller of judicialSellers) {
        const processResult = await services.judicialProcess.createJudicialProcess(entityStore.tenantId, {
            processNumber: `${faker.string.numeric(7)}-${faker.string.numeric(2)}.${faker.date.past({years: 5}).getFullYear()}.${faker.string.numeric(1)}.${faker.string.numeric(2)}.${faker.string.numeric(4)}`,
            sellerId: seller.id.toString(),
            branchId: seller.judicialBranchId?.toString(),
            parties: [ { name: faker.person.fullName(), partyType: ProcessPartyType.AUTOR }, { name: faker.company.name(), partyType: ProcessPartyType.REU } ]
        } as any);
        if (processResult.success && processResult.processId) {
            const process = await prisma.judicialProcess.findUnique({where: { id: BigInt(processResult.processId) }});
            if (process) entityStore.judicialProcesses.push(process);
        }
    }
    log(`${entityStore.judicialProcesses.length} processos judiciais criados.`, 1);
}

async function seedAssets() {
    log('Fase 7: Ativos (Bens)...', 0);
    for (let i = 0; i < TOTAL_ASSETS; i++) {
        const category = faker.helpers.arrayElement(entityStore.categories);
        const subcategory = faker.helpers.arrayElement(category.subcategories);
        const seller = faker.helpers.arrayElement(entityStore.sellers);
        const randomMedia = entityStore.mediaItems.length > 0 ? faker.helpers.arrayElement(entityStore.mediaItems) : null;
        
        const assetResult = await services.asset.createAsset(entityStore.tenantId, {
            title: `${faker.commerce.productName()} (Asset ${i})`,
            status: AssetStatus.DISPONIVEL,
            evaluationValue: faker.number.int({ min: 500, max: 250000 }),
            categoryId: category.id.toString(),
            sellerId: seller.id.toString(),
            imageUrl: randomMedia?.urlOriginal,
            imageMediaId: randomMedia?.id.toString(),
        } as any);

        if (!assetResult.success) {
            console.error(`Falha ao criar ativo: ${assetResult.message}`);
        }
    }
    entityStore.assets = await services.asset.getAssets({ tenantId: entityStore.tenantId });
    log(`${entityStore.assets.length} ativos criados.`, 1);
}

async function seedAuctionsAndLots() {
    log('Fase 8: Leilões, Etapas e Lotes...', 0);
    for (let i = 0; i < TOTAL_AUCTIONS; i++) {
        const seller = faker.helpers.arrayElement(entityStore.sellers);
        const auctionType = seller.isJudicial ? AuctionType.JUDICIAL : randomEnum(AuctionType);
        const status = randomEnum(AuctionStatus);
        const auctionDate = status === 'EM_BREVE' ? faker.date.soon({ days: 15 }) : faker.date.recent({ days: 10 });

        const auctionResult = await services.auction.createAuction(entityStore.tenantId, {
            title: `Leilão ${auctionType} #${i + 1}`,
            status, auctionType,
            auctioneerId: faker.helpers.arrayElement(entityStore.auctioneers).id.toString(),
            sellerId: seller.id.toString(),
            auctionStages: [ { name: '1ª Praça', startDate: auctionDate, endDate: add(auctionDate, { days: 3 }) } ],
            categoryId: faker.helpers.arrayElement(entityStore.categories).id.toString(),
        } as any);

        if (!auctionResult.success || !auctionResult.auctionId) continue;
        
        const numLots = status === 'RASCUNHO' ? 0 : faker.number.int({ min: 1, max: MAX_LOTS_PER_AUCTION });
        const availableAssets = entityStore.assets.filter(a => a.status === AssetStatus.DISPONIVEL && a.sellerId === seller.id);
        log(`  - Seller ${seller.name} (${seller.id}): ${availableAssets.length} assets disponíveis.`, 2);

        for (let j = 0; j < numLots; j++) {
            const assetsForLot = faker.helpers.arrayElements(availableAssets.filter(a => a.status === AssetStatus.DISPONIVEL), { min: 1, max: MAX_ASSETS_PER_LOT });
            log(`    - Tentando criar lote com ${assetsForLot.length} assets.`, 3);
            if (assetsForLot.length === 0) continue;
            
            const lotResult = await services.lot.createLot({
                title: faker.commerce.productName(),
                auctionId: auctionResult.auctionId,
                assetIds: assetsForLot.map(a => a.id.toString()),
                price: assetsForLot.reduce((sum, a) => sum + (a.evaluationValue || 0), 0),
                type: assetsForLot[0].categoryId?.toString(),
            }, entityStore.tenantId, entityStore.users[0].id.toString());

            if(lotResult.success && lotResult.lotId) {
                const lot = await prisma.lot.findUnique({where: {id: BigInt(lotResult.lotId)}});
                if(lot) {
                    entityStore.lots.push(lot);
                    assetsForLot.forEach(a => { a.status = AssetStatus.LOTEADO });
                }
            }
        }
        const auction = await prisma.auction.findUnique({ where: { id: BigInt(auctionResult.auctionId) }, include: { stages: true } });
        if (auction) {
            entityStore.auctions.push(auction);
            await seedAuctionHabilitations(auction.id.toString());
        }
    }
    log(`${entityStore.auctions.length} leilões e ${entityStore.lots.length} lotes criados.`, 1);
}

async function seedAuctionHabilitations(auctionId: string) {
    const habilitatedUsers = entityStore.users.filter(u => u.habilitationStatus === UserHabilitationStatus.HABILITADO);
    if(habilitatedUsers.length === 0) return;

    const usersToHabilitate = faker.helpers.arrayElements(habilitatedUsers, { min: 5, max: 20 });

    for (const user of usersToHabilitate) {
        await prisma.auctionHabilitation.create({
            data: {
                auctionId: BigInt(auctionId),
                userId: user.id,
            }
        });
    }
}

async function seedInteractions() {
    log('Fase 9: Interações (Lances, Arremates, Pagamentos)...', 0);
    const lotsForBidding = entityStore.lots.filter(l => l.status === LotStatus.ABERTO_PARA_LANCES);
    const bidderUsers = entityStore.users.filter(u => u.roleNames.includes('BIDDER'));

    if (lotsForBidding.length === 0 || bidderUsers.length < 2) return;

    await seedUserLotMaxBids();
    
    for (const lot of lotsForBidding) {
        let currentPrice = Number(lot.price);
        let lastBidder: any = null;
        const bidsForThisLot = faker.number.int({ min: 10, max: MAX_BIDS_PER_LOT });
        for (let i = 0; i < bidsForThisLot; i++) {
            const bidder = faker.helpers.arrayElement(bidderUsers);
            currentPrice += faker.number.int({ min: 50, max: 500 });
            await services.bid.createBid({
                lot: { connect: { id: lot.id } },
                auction: { connect: { id: lot.auctionId } },
                bidder: { connect: { id: bidder.id } },
                tenant: { connect: { id: BigInt(entityStore.tenantId) } },
                bidderDisplay: bidder.fullName || 'Anônimo',
                amount: currentPrice,
            });
            lastBidder = bidder;
        }

        if (lastBidder && lot.status !== LotStatus.VENDIDO) {
             const winResult = await services.userWin.create({
                user: { connect: { id: lastBidder.id } },
                lot: { connect: { id: lot.id } },
                winningBidAmount: new Prisma.Decimal(currentPrice),
            });
            if (winResult) {
                entityStore.userWins.push(winResult as any);
                await prisma.lot.update({ where: { id: lot.id }, data: { status: LotStatus.VENDIDO, winnerId: lastBidder.id } });
                
                if(faker.datatype.boolean(0.5)) {
                    const paymentResult = await services.installmentPayment.createInstallmentsForWin(winResult as any, faker.number.int({ min: 2, max: 6 }));
                    if (paymentResult.success && paymentResult.payments.length > 0) {
                        await services.installmentPayment.updatePaymentStatus(paymentResult.payments[0].id, PaymentStatus.PAGO);
                    }
                } else {
                    await prisma.userWin.update({ where: { id: winResult.id }, data: { paymentStatus: 'PAGO' } });
                }
            }
        }
    }
    const bidCount = await prisma.bid.count();
    log(`${bidCount} lances criados e ${entityStore.userWins.length} lotes arrematados.`, 1);
}

async function seedUserLotMaxBids() {
    log('Fase 9a: Lances Máximos de Usuários (Auto-Lances)...', 0);
    const lotsWithBids = entityStore.lots.filter(l => l.status === LotStatus.ABERTO_PARA_LANCES);
    const habilitatedUsers = entityStore.users.filter(u => u.roleNames.includes('BIDDER'));

    if (lotsWithBids.length === 0 || habilitatedUsers.length === 0) return;

    for (const lot of lotsWithBids) {
        if (faker.datatype.boolean(0.3)) {
            const user = faker.helpers.arrayElement(habilitatedUsers);
            await services.userLotMaxBid.createOrUpdateUserLotMaxBid({
                userId: user.id, lotId: lot.id, maxAmount: Number(lot.price) + faker.number.int({ min: 500, max: 5000 }),
            });
        }
    }
}

async function seedPostAuctionInteractions() {
    log('Fase 10: Interações Pós-Leilão (Perguntas, Avaliações)...', 0);
    const users = entityStore.users.filter(u => u.roleNames.includes('BIDDER'));
    if (users.length === 0) return;

    for (const lot of entityStore.lots) {
        if (faker.datatype.boolean(0.2)) {
            const user = faker.helpers.arrayElement(users);
            const questionResult = await services.lotQuestion.create({
                lotId: lot.id.toString(), userId: user.id.toString(), userDisplayName: user.fullName!, questionText: faker.lorem.sentence() + '?', auctionId: lot.auctionId.toString()
            });
            await services.lotQuestion.addAnswer(questionResult.id.toString(), faker.lorem.sentence(), entityStore.users[0].id.toString(), entityStore.users[0].fullName!);
        }
    }
    log(`Perguntas e respostas criadas.`, 1);

    for (const win of entityStore.userWins) {
        if (faker.datatype.boolean(0.5)) {
            const user = entityStore.users.find(u => u.id === win.userId);
            const lot = await prisma.lot.findUnique({ where: { id: win.lotId } });
            if (lot && user) {
                await services.review.create({
                    lotId: win.lotId.toString(), auctionId: lot.auctionId.toString(), userId: win.userId.toString(), authorName: user.fullName!,
                    rating: faker.number.int({ min: 3, max: 5 }), comment: faker.lorem.paragraph(),
                });
            }
        }
    }
    log(`Avaliações criadas para lotes arrematados.`, 1);
}

async function seedDirectSaleOffers() {
    log('Fase 11a: Ofertas de Venda Direta...', 0);
    for (let i = 0; i < 20; i++) {
        const category = faker.helpers.arrayElement(entityStore.categories);
        const seller = faker.helpers.arrayElement(entityStore.sellers);

        await services.directSaleOffer.createDirectSaleOffer(entityStore.tenantId.toString(), {
          title: `Venda Direta: ${faker.commerce.productName()}`,
          status: randomEnum(DirectSaleOfferStatus),
          offerType: randomEnum(DirectSaleOfferType),
          price: faker.number.int({ min: 100, max: 5000 }),
          categoryId: category.id.toString(),
          sellerId: seller.id.toString(),
          sellerName: seller.name
        } as any);
    }
    log(`20 ofertas de venda direta criadas.`, 1);
}

async function seedMiscData() {
    log('Fase 11: Dados Diversos (Mensagens, Notificações, Assinantes, etc)...', 0);
    
    await services.notification.deleteMany({});
    await services.subscriber.deleteMany({});

    const usersWithNotifications = faker.helpers.arrayElements(entityStore.users, { min: 10, max: 30 });
    for (const user of usersWithNotifications) {
        await services.notification.createNotification({
            userId: user.id,
            message: faker.lorem.sentence(),
            link: faker.internet.url(),
            tenantId: BigInt(entityStore.tenantId),
        });
    }

    for (let i = 0; i < 50; i++) {
        await services.subscriber.createSubscriber({
            email: faker.internet.email(),
            name: faker.person.fullName(),
        });
    }
    log('Notificações e assinantes criados.', 1);

    await services.contactMessage.deleteAllContactMessages();
    for (let i = 0; i < 15; i++) {
        await services.contactMessage.saveMessage({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            subject: faker.lorem.sentence(),
            message: faker.lorem.paragraph(),
        });
    }
    log('Mensagens de contato criadas.', 1);
}

async function logSummary() {
    const counts = {
      tenants: await prisma.tenant.count(),
      users: await prisma.user.count(),
      categories: await prisma.lotCategory.count(),
      assets: await prisma.asset.count(),
      auctions: await prisma.auction.count(),
      lots: await prisma.lot.count(),
      bids: await prisma.bid.count(),
      wins: await prisma.userWin.count(),
      installments: await prisma.installmentPayment.count(),
      notifications: await prisma.notification.count(),
    };
    console.log('\nResumo do Seeding:');
    console.log(`- Tenants: ${counts.tenants}`);
    console.log(`- Usuários: ${counts.users}`);
    console.log(`- Categorias: ${counts.categories}`);
    console.log(`- Ativos: ${counts.assets}`);
    console.log(`- Leilões: ${counts.auctions}`);
    console.log(`- Lotes: ${counts.lots}`);
    console.log(`- Lances: ${counts.bids}`);
    console.log(`- Arremates (Wins): ${counts.wins}`);
    console.log(`- Parcelas: ${counts.installments}`);
    console.log(`- Notificações: ${counts.notifications}`);
    console.log('=====================================================');
}

main();
