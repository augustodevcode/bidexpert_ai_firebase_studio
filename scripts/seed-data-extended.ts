/**
 * @fileoverview Script de seed completo e corrigido para a plataforma BidExpert.
 * Popula TODAS as tabelas do banco de dados com dados consistentes e interligados,
 * abrangendo todos os enums e cenários de negócio para garantir uma base de dados robusta
 * para desenvolvimento e testes.
 *
 * Para executar: `npx tsx scripts/seed-data-extended.ts`
 */
import { PrismaClient, Prisma, UserHabilitationStatus, AssetStatus, AuctionStatus, AuctionType, AuctionMethod, AuctionParticipation, ProcessPartyType } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  AuctionService,
  LotService,
  UserService,
  SellerService,
  AuctioneerService,
  CategoryService,
  SubcategoryService,
  AssetService,
  JudicialProcessService,
  CourtService,
  JudicialDistrictService,
  JudicialBranchService,
  StateService,
  CityService,
  LotQuestionService,
  ReviewService,
  UserWinService,
  DirectSaleOfferService,
  InstallmentPaymentService,
  NotificationService,
  ContactMessageService,
  DocumentTemplateService,
  MediaService,
  ReportService,
  DataSourceService,
  DocumentService,
  RoleService,
  DocumentTypeService,
  TenantService,
  AuctionHabilitationService,
  BidService,
  UserLotMaxBidService,
  PlatformSettingsService,
  VehicleMakeService,
  VehicleModelService,
  AuctionStageService,
  SubscriberService,
} from './services'; // Assumindo que os serviços estão em './services'

const prisma = new PrismaClient();

// --- Funções Utilitárias ---
const log = (message: string, level = 0) => {
  console.log(`${'  '.repeat(level)}- ${message}`);
};

const randomEnum = <T extends object>(e: T): T[keyof T] => {
  const values = Object.values(e).filter(v => typeof v === 'string');
  return values[Math.floor(Math.random() * values.length)] as T[keyof T];
};

const slugify = (text: string) => {
  if (!text) return '';
  return text.toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^-￿\w-]+/g, '').replace(/--+/g, '-');
};

// --- Armazenamento de Entidades Criadas ---
const entityStore: {
  tenantId: bigint;
  roles: Record<string, bigint>;
  users: { id: bigint; habilitation: string; email: string }[];
  categories: { id: bigint; subcategoryIds: bigint[] }[];
  states: Record<string, bigint>;
  cities: Record<string, bigint>;
  courts: bigint[];
  judicialDistricts: bigint[];
  judicialBranches: bigint[];
  sellers: { id: bigint; isJudicial: boolean }[];
  auctioneers: bigint[];
  judicialProcesses: bigint[];
  assets: { id: bigint; status: string; categoryId: bigint; mediaId?: bigint }[];
  auctions: { id: bigint; status: Prisma.AuctionStatus; auctionType: Prisma.AuctionType; lotIds: bigint[] }[];
  lots: { id: bigint; status: Prisma.LotStatus; auctionId: bigint; initialPrice: number; assetIds: bigint[] }[];
  mediaItems: bigint[];
  documentTypes: Record<string, bigint>;
  userWins: bigint[];
  vehicleMakes: Record<string, bigint>;
  vehicleModels: bigint[];
} = {
  tenantId: BigInt(1),
  roles: {},
  users: [],
  categories: [],
  states: {},
  cities: {},
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
  vehicleMakes: {},
  vehicleModels: [],
};

// --- Instâncias dos Serviços ---
const services = {
  userService: new UserService(),
  roleService: new RoleService(),
  sellerService: new SellerService(),
  auctioneerService: new AuctioneerService(),
  categoryService: new CategoryService(),
  subcategoryService: new SubcategoryService(),
  assetService: new AssetService(),
  stateService: new StateService(),
  cityService: new CityService(),
  courtService: new CourtService(),
  judicialDistrictService: new JudicialDistrictService(),
  judicialBranchService: new JudicialBranchService(),
  judicialProcessService: new JudicialProcessService(),
  auctionService: new AuctionService(),
  lotService: new LotService(),
  userWinService: new UserWinService(),
  directSaleOfferService: new DirectSaleOfferService(),
  notificationService: new NotificationService(),
  contactMessageService: new ContactMessageService(),
  documentTemplateService: new DocumentTemplateService(),
  subscriberService: new SubscriberService(),
  mediaService: new MediaService(),
  reportService: new ReportService(),
  dataSourceService: new DataSourceService(),
  documentService: new DocumentService(),
  documentTypeService: new DocumentTypeService(),
  lotQuestionService: new LotQuestionService(),
  reviewService: new ReviewService(),
  installmentPaymentService: new InstallmentPaymentService(),
  tenantService: new TenantService(),
  auctionHabilitationService: new AuctionHabilitationService(),
  bidService: new BidService(),
  userLotMaxBidService: new UserLotMaxBidService(),
  platformSettingsService: new PlatformSettingsService(),
  vehicleMakeService: new VehicleMakeService(),
  vehicleModelService: new VehicleModelService(),
  auctionStageService: new AuctionStageService(),
};

// --- Constantes de Geração ---
const TOTAL_USERS = 50;
const TOTAL_SELLERS = 25;
const TOTAL_AUCTIONEERS = 8;
const TOTAL_ASSETS = 400;
const TOTAL_AUCTIONS = 75;
const MAX_LOTS_PER_AUCTION = 8;
const MAX_ASSETS_PER_LOT = 2;
const MAX_BIDS_PER_LOT = 40;
const IMAGE_PLACEHOLDER_DIR = path.join(process.cwd(), 'public/uploads/sample-images');

// --- Lógica Principal de Seeding ---

async function main() {
  console.log('🚀 Iniciando o seed completo e robusto do banco de dados...');
  console.log('=====================================================\n');

  try {
    await cleanupPreviousData();
    await seedCoreInfra();
    await seedMedia();
    await seedCategoriesAndVehicles();
    await seedLocations();
    await seedJudicialInfra();
    await seedParticipants();
    await seedAssets();
    await seedAuctionsAndLots();
    await seedInteractions();
    await seedPostAuctionInteractions();
    await seedMiscData();

    console.log('\n=====================================================');
    console.log('✅ Seed do banco de dados finalizado com sucesso!');
    console.log('=====================================================');
    logSummary();
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
    // A ordem é crucial para respeitar as constraints de chave estrangeira
    await prisma.$transaction([
      prisma.notification.deleteMany(),
      prisma.subscriber.deleteMany(),
      prisma.review.deleteMany(),
      prisma.lotQuestion.deleteMany(),
      prisma.directSaleOffer.deleteMany(),
      prisma.installmentPayment.deleteMany(),
      prisma.bid.deleteMany(),
      prisma.userLotMaxBid.deleteMany(),
      prisma.userWin.deleteMany(),
      prisma.assetsOnLots.deleteMany(),
      prisma.lotStageDetails.deleteMany(),
      prisma.lot.deleteMany(),
      prisma.auctionStage.deleteMany(),
      prisma.auctionHabilitation.deleteMany(),
      prisma.auction.deleteMany(),
      prisma.asset.deleteMany(),
      prisma.seller.deleteMany(),
      prisma.auctioneer.deleteMany(),
      prisma.judicialParty.deleteMany(),
      prisma.judicialProcess.deleteMany(),
      prisma.userDocument.deleteMany(),
      prisma.vehicleModel.deleteMany(),
      prisma.vehicleMake.deleteMany(),
      prisma.assetMedia.deleteMany(),
      prisma.mediaItem.deleteMany(),
      prisma.judicialBranch.deleteMany(),
      prisma.judicialDistrict.deleteMany(),
      prisma.court.deleteMany(),
      prisma.city.deleteMany(),
      prisma.state.deleteMany(),
      prisma.subcategory.deleteMany(),
      prisma.lotCategory.deleteMany(),
      prisma.contactMessage.deleteMany(),
      prisma.documentTemplate.deleteMany(),
      prisma.report.deleteMany(),
      prisma.dataSource.deleteMany(),
    ]);
    log('Dados de transações e entidades relacionadas limpos.', 1);
}

async function seedCoreInfra() {
  log('Fase 1: Infraestrutura Core (Tenant, Roles, Admin, Tipos de Documento)...', 0);

  // 1. Find or Create Tenant
  log('Garantindo a existência do Tenant...', 1);
  let tenant = await services.tenantService.findTenantBySubdomain('bidexpert');
  if (!tenant) {
    const tenantResult = await services.tenantService.createTenant({ name: 'BidExpert Platform', subdomain: 'bidexpert' });
    if (tenantResult.success && tenantResult.tenant) {
      tenant = tenantResult.tenant;
      log(`Tenant "${tenant.name}" criado.`, 2);
    } else {
      throw new Error(`Failed to create tenant: ${tenantResult.message}`);
    }
  } else {
    log(`Tenant "${tenant.name}" já existe.`, 2);
  }
  entityStore.tenantId = tenant.id;

  // 2. Find or Create Platform Settings
  log('Garantindo configurações da plataforma...', 1);
  let settings = await services.platformSettingsService.getSettings(entityStore.tenantId);
  if (!settings) {
      settings = await services.platformSettingsService.saveSettings(entityStore.tenantId, {
          siteTitle: 'BidExpert Leilões',
          platformPublicIdMasks: {
              auctionCodeMask: 'L-YYYY-NNNNN',
              lotCodeMask: 'B-YYYY-NNNNN',
              sellerCodeMask: 'V-YYYY-NNNNN',
              auctioneerCodeMask: 'P-YYYY-NNNNN',
              assetCodeMask: 'A-YYYY-NNNNN',
              categoryCodeMask: 'C-YYYY-NNNNN',
              subcategoryCodeMask: 'S-YYYY-NNNNN',
          },
          paymentGatewaySettings: {
              platformCommissionPercentage: 5,
          },
          isSetupComplete: true,
      });
      log('Configurações padrão da plataforma criadas.', 2);
  } else {
      log('Configurações da plataforma já existem.', 2);
  }

  // 3. Find or Create Roles
  log('Criando Roles...', 1);
  const roleNames = ['ADMIN', 'USER', 'BIDDER', 'SELLER_ADMIN', 'AUCTIONEER_ADMIN'];
  for (const name of roleNames) {
    const role = await services.roleService.findOrCreateRole({ name, nameNormalized: name, description: `${name} role` });
    entityStore.roles[name] = role.id;
    log(`Role "${name}" garantido.`, 2);
  }

  // 4. Find or Create Admin User
  log('Criando Usuário Administrador...', 1);
  const adminEmail = 'admin@bidexpert.com';
  let admin = await services.userService.findUserByEmail(adminEmail);
  if (!admin) {
    const adminData = {
      email: adminEmail, password: 'admin123', fullName: 'Administrador',
      habilitationStatus: UserHabilitationStatus.HABILITADO,
      accountType: Prisma.AccountType.PHYSICAL,
      roleIds: [entityStore.roles.ADMIN],
      tenantIds: [entityStore.tenantId],
    };
    const adminResult = await services.userService.createUser(adminData);
    if (adminResult.success) {
        if (!adminResult.userId) throw new Error('Admin user ID not returned after creation.');
        admin = await services.userService.getUserById(adminResult.userId);
        if (!admin) throw new Error('Failed to fetch created admin user.');
        log(`Admin user created: ${admin.email}`, 2);
    } else {
      throw new Error(`Failed to create admin user: ${adminResult.message}`);
    }
  } else {
    log(`Usuário Admin já existe: ${admin.email}`, 2);
  }
  entityStore.users.push(admin);
  log(`Usuário Admin pronto: ${admin.email}`, 2);

  // 5. Create Document Types
  log('Criando Tipos de Documento...', 1);
  const docTypes = [
    { name: 'CPF', description: 'Cadastro de Pessoa Física', isRequired: true, appliesTo: 'PHYSICAL' },
    { name: 'RG', description: 'Registro Geral', isRequired: true, appliesTo: 'PHYSICAL' },
    { name: 'Comprovante de Residência', description: 'Comprovante de endereço', isRequired: true, appliesTo: 'PHYSICAL,LEGAL' },
    { name: 'CNPJ', description: 'Cadastro Nacional de Pessoa Jurídica', isRequired: true, appliesTo: 'LEGAL' },
    { name: 'Contrato Social', description: 'Contrato social da empresa', isRequired: true, appliesTo: 'LEGAL' },
    { name: 'Termo de Adesão', description: 'Termo de adesão assinado', isRequired: true, appliesTo: 'PHYSICAL,LEGAL' },
  ];
  for (const docType of docTypes) {
    const created = await services.documentTypeService.upsertDocumentType(docType);
    entityStore.documentTypes[docType.name] = created.id;
  }
  log(`${docTypes.length} tipos de documento garantidos.`, 2);

  log('Adicionando e validando documentos para o Admin...', 2);
  const adminDocs = ['CPF', 'RG', 'Comprovante de Residência', 'Termo de Adesão'];
  for (const docName of adminDocs) {
          const docTypeId = entityStore.documentTypes[docName];
          if (docTypeId) {
            const doc = await services.documentService.saveUserDocument(
              admin.id,
              docTypeId,
              `https://example.com/docs/admin/${slugify(docName)}.pdf`,
              `${slugify(docName)}.pdf`
            );
            if(doc.success) await services.documentService.adminUpdateUserDocumentStatus(admin.id, docTypeId, 'APPROVED');
            log(`Documento '${docName}' criado e validado para o Admin.`, 3);
          }
  }
}

async function seedMedia() {
    log('Fase 2: Mídia (Imagens de Exemplo)...', 0);
    if (!fs.existsSync(IMAGE_PLACEHOLDER_DIR)) {
        log(`Diretório de imagens de exemplo não encontrado em ${IMAGE_PLACEHOLDER_DIR}. Pulando esta fase.`, 1);
        return;
    }
    const imageFiles = fs.readdirSync(IMAGE_PLACEHOLDER_DIR).filter(f => f.match(/\.(jpg|jpeg|png|webp)$/));
    const adminUserId = entityStore.users[0].id;
    for (const fileName of imageFiles) {
        const url = `/uploads/sample-images/${fileName}`;
        const mediaResult = await services.mediaService.createMediaItem(
            {
                fileName: fileName,
                mimeType: `image/${path.extname(fileName).substring(1)}`,
                sizeBytes: fs.statSync(path.join(IMAGE_PLACEHOLDER_DIR, fileName)).size,
                storagePath: url,
                url: url,
                title: faker.commerce.productName(),
            },
            url,
            adminUserId
        );
        if (mediaResult.success && mediaResult.item) {
            entityStore.mediaItems.push(mediaResult.item.id);
        }
    }
    log(`${entityStore.mediaItems.length} itens de mídia criados a partir de arquivos locais.`, 1);
    if (entityStore.mediaItems.length === 0) {
        throw new Error("Nenhuma imagem de exemplo foi carregada. O seed não pode continuar sem imagens para associar.");
    }
}

async function seedCategoriesAndVehicles() {
    log('Fase 3: Categorias, Subcategorias e Veículos...', 0);
    const categoryData = {
      'Imóveis': ['Apartamentos', 'Casas', 'Terrenos', 'Salas Comerciais', 'Galpões', 'Fazendas'],
      'Veículos': ['Carros', 'Motos', 'Caminhões', 'Ônibus', 'Vans', 'Maquinário Pesado'],
      'Eletrônicos': ['Celulares', 'Notebooks', 'TVs', 'Câmeras', 'Videogames'],
      'Arte e Antiguidades': ['Pinturas', 'Esculturas', 'Móveis Antigos', 'Itens de Colecionador'],
      'Maquinário Industrial': ['Tornos', 'Prensas', 'Geradores', 'Compressores'],
      'Diversos': ['Materiais de Escritório', 'Saldos de Estoque', 'Direitos Creditórios'],
    };

    for (const catName of Object.keys(categoryData)) {
        const catResult = await services.categoryService.createCategory({ name: catName, description: `Categoria de ${catName}` });
        if (catResult.success && catResult.category) {
            const category = catResult.category;
            const subcategoryIds: bigint[] = [];
            log(`Categoria "${catName}" criada.`, 1);

            for (const subcatName of categoryData[catName as keyof typeof categoryData]) {
                const subcatResult = await services.subcategoryService.createSubcategory({ name: subcatName, parentCategoryId: category.id });
                if (subcatResult.success && subcatResult.subcategory) {
                    subcategoryIds.push(subcatResult.subcategory.id);
                    log(`Subcategoria "${subcatName}" criada em "${catName}".`, 2);
                }
            }
            entityStore.categories.push({ id: category.id, subcategoryIds });
        }
    }
    console.log('Categories in entityStore:', entityStore.categories);

    log('Criando Marcas e Modelos de Veículos...', 1);
    const vehicleData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts/data/vehicle-makes-and-models.json'), 'utf-8'));
    for (const makeName of Object.keys(vehicleData)) {
        const makeResult = await services.vehicleMakeService.createVehicleMake({ name: makeName });
        if (makeResult.success && makeResult.make) {
            entityStore.vehicleMakes[makeName] = makeResult.make.id;
            for (const modelName of vehicleData[makeName]) {
                const modelResult = await services.vehicleModelService.createVehicleModel({ name: modelName, makeId: makeResult.make.id });
                if (modelResult.success && modelResult.model) {
                    entityStore.vehicleModels.push(modelResult.model.id);
                }
            }
        }
    }
    log(`${Object.keys(entityStore.vehicleMakes).length} marcas e ${entityStore.vehicleModels.length} modelos de veículos criados.`, 2);
}

async function seedLocations() {
    log('Fase 4: Localizações (Estados e Cidades)...', 0);
    const locations = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts/data/brazilian-states-and-cities.json'), 'utf-8'));
    for (const state of locations) {
        const stateResult = await services.stateService.createState({ name: state.nome, uf: state.sigla });
        if (stateResult.success && stateResult.stateId) {
            entityStore.states[state.sigla] = stateResult.stateId;
            for (const cityName of state.cidades) {
                const cityResult = await services.cityService.createCity({ name: cityName, stateId: stateResult.stateId });
                if (cityResult.success && cityResult.cityId) {
                    entityStore.cities[cityName] = cityResult.cityId;
                }
            }
        }
    }
    log(`${Object.keys(entityStore.states).length} estados e ${Object.keys(entityStore.cities).length} cidades criados.`, 1);
}

async function seedJudicialInfra() {
    log('Fase 5: Infraestrutura Judicial (Tribunais, Comarcas, Varas)...', 0);

    log('Criando Tribunais...', 1);
    for (let i = 0; i < 10; i++) {
        const court = await services.courtService.createCourt({ name: `Tribunal de Justiça ${i+1}` });
        entityStore.courts.push(court.id);
    }
    log(`${entityStore.courts.length} tribunais criados.`, 2);

    log('Criando Comarcas...', 1);
    for (let i = 0; i < 15; i++) {
        const district = await services.judicialDistrictService.createJudicialDistrict({
            name: `Comarca de ${faker.location.city()}`,
            courtId: faker.helpers.arrayElement(entityStore.courts),
            stateId: faker.helpers.arrayElement(Object.values(entityStore.states)),
        });
        entityStore.judicialDistricts.push(district.id);
    }
    log(`${entityStore.judicialDistricts.length} comarcas criadas.`, 2);

    log('Criando Varas Judiciais...', 1);
    for (let i = 0; i < 20; i++) {
        const branch = await services.judicialBranchService.createJudicialBranch({
            name: `${i+1}ª Vara Cível de ${faker.location.city()}`,
            districtId: faker.helpers.arrayElement(entityStore.judicialDistricts),
        });
        entityStore.judicialBranches.push(branch.id);
    }
    log(`${entityStore.judicialBranches.length} varas criadas.`, 2);
}

async function seedParticipants() {
    log('Fase 6: Participantes (Leiloeiros, Vendedores, Arrematantes)...', 0);
    
    log('Criando Leiloeiros...', 1);
    for (let i = 0; i < TOTAL_AUCTIONEERS; i++) {
        const name = `Leiloeiro Oficial ${i + 1}`;
        const result = await services.auctioneerService.createAuctioneer(entityStore.tenantId, {
          name: `${name} - ${faker.string.uuid().substring(0, 4)}`,
          email: faker.internet.email(),
          phone: faker.phone.number(),
          description: `Leiloeiro oficial certificado com anos de experiência.`,
        });
        if (result.success && result.auctioneer) entityStore.auctioneers.push(result.auctioneer.id);
    }
    log(`${entityStore.auctioneers.length} leiloeiros criados.`, 2);

    log('Criando Vendedores...', 1);
    for (let i = 0; i < TOTAL_SELLERS; i++) {
        const isJudicial = i % 4 === 0;
        const name = isJudicial ? `Massa Falida ${faker.company.name()}` : `Vendedor Particular ${i+1}`;
        const data: Prisma.SellerCreateInput = {
            name,
            publicId: uuidv4(),
            slug: slugify(name),
            email: faker.internet.email(),
            isJudicial,
            tenant: { connect: { id: entityStore.tenantId } },
            judicialBranch: isJudicial ? { connect: { id: faker.helpers.arrayElement(entityStore.judicialBranches) } } : undefined,
        };
        const result = await services.sellerService.createSeller(entityStore.tenantId, data);
        if (result.success && result.seller) {
            entityStore.sellers.push({ id: result.seller.id, isJudicial });
        }
    }
    log(`${entityStore.sellers.length} vendedores criados (${entityStore.sellers.filter(s=>s.isJudicial).length} judiciais).`, 2);

    log('Criando Arrematantes...', 1);
    const userStatuses = Object.values(UserHabilitationStatus);
    for (let i = 0; i < TOTAL_USERS; i++) {
        const email = `arrematante${i}@bidexpert.com`;
        const habilitationStatus = userStatuses[i % userStatuses.length];
        const accountType = i % 3 === 0 ? 'LEGAL' : 'PHYSICAL';
        const userData = {
            email, password: 'bidder123', fullName: faker.person.fullName(), habilitationStatus,
            accountType,
            roleIds: [entityStore.roles.BIDDER, entityStore.roles.USER],
            tenantIds: [entityStore.tenantId],
            cnpj: accountType === 'LEGAL' ? faker.string.numeric(14) : undefined,
            razaoSocial: accountType === 'LEGAL' ? faker.company.name() : undefined,
        };
        let user = await services.userService.findUserByEmail(email);
        if (!user) {
            const userResult = await services.userService.createUser(userData);
            if (userResult.success) {
                user = await services.userService.getUserById(userResult.userId);
                if (!user) throw new Error('Failed to fetch created bidder user.');
            } else {
                throw new Error(`Failed to create bidder user: ${userResult.message}`);
            }
        } else {
            log(`Usuário arrematante já existe: ${user.email}`, 2);
        }
        entityStore.users.push(user);
    }
    log(`${entityStore.users.length} usuários (admin + arrematantes) criados com diversos status.`, 2);
}

async function seedAssets() {
    log('Fase 7: Ativos (Bens)...', 0);
    const assetStatuses = Object.values(AssetStatus);
    for (let i = 0; i < TOTAL_ASSETS; i++) {
        const category = faker.helpers.arrayElement(entityStore.categories);
        const mediaId = faker.helpers.arrayElement(entityStore.mediaItems);
        const seller = faker.helpers.arrayElement(entityStore.sellers); // Define seller here

        const data: Prisma.AssetCreateInput = {
            title: `${faker.commerce.productName()} (Asset ${i})`,
            description: faker.lorem.paragraph(),
            status: assetStatuses[i % assetStatuses.length],
            evaluationValue: faker.number.int({ min: 500, max: 250000 }),
            publicId: uuidv4(),
            tenant: { connect: { id: entityStore.tenantId } },
            category: { connect: { id: category.id } },
            subcategory: { connect: { id: faker.helpers.arrayElement(category.subcategoryIds) } },
            seller: { connect: { id: seller.id } },
            city: { connect: { id: faker.helpers.arrayElement(Object.values(entityStore.cities)) } },
            state: { connect: { id: faker.helpers.arrayElement(Object.values(entityStore.states)) } },
            assetMedia: {
              create: {
                mediaId: mediaId,
                displayOrder: 0,
              }
            }
        };
        const result = await services.assetService.createAsset(data);
        if (result.success && result.asset) {
            entityStore.assets.push({ id: result.asset.id, status: result.asset.status, categoryId: category.id, mediaId });
        }
    }
    log(`${entityStore.assets.length} ativos criados, todos com imagem principal.`, 1);
}

async function seedAuctionsAndLots() {
    log('Fase 8: Leilões, Etapas e Lotes...', 0);
    const auctionStatuses = Object.values(AuctionStatus);
    const auctionTypes = Object.values(AuctionType);

    for (let i = 0; i < TOTAL_AUCTIONS; i++) {
        const seller = faker.helpers.arrayElement(entityStore.sellers);
        const status = auctionStatuses[i % auctionStatuses.length];
        const auctionType = seller.isJudicial ? AuctionType.JUDICIAL : auctionTypes[i % auctionTypes.length];
        const auctionDate = status === AuctionStatus.EM_BREVE ? faker.date.soon({ days: 15 }) : faker.date.recent({ days: 10 });

        let judicialProcessId: bigint | undefined = undefined;
        if (auctionType === AuctionType.JUDICIAL) {
            const processResult = await services.judicialProcessService.createJudicialProcess(entityStore.tenantId, {
                processNumber: `${faker.number.int({ min: 1000000, max: 9999999 })}-02.${new Date().getFullYear()}.8.26.${faker.number.int({ min: 1000, max: 9999 })}`,
                isElectronic: faker.datatype.boolean(),
                courtId: faker.helpers.arrayElement(entityStore.courts),
                districtId: faker.helpers.arrayElement(entityStore.judicialDistricts),
                branchId: faker.helpers.arrayElement(entityStore.judicialBranches),
                sellerId: seller.id,
                parties: Array.from({ length: faker.number.int({ min: 2, max: 4 }) }, (_, i) => ({
                    name: faker.person.fullName(),
                    partyType: randomEnum(ProcessPartyType),
                    documentNumber: faker.string.numeric(11),
                })),
            });
            if (processResult.success && processResult.process) {
                judicialProcessId = processResult.process.id;
                entityStore.judicialProcesses.push(processResult.process.id);
            }
        }

        const auctionData: Prisma.AuctionCreateInput = {
            title: `Leilão ${auctionType} #${i + 1}`,
            publicId: uuidv4(),
            slug: slugify(`Leilão ${auctionType} #${i + 1} ${uuidv4()}`),
            description: faker.lorem.sentences(3),
            status,
            auctionType,
            auctionMethod: randomEnum(AuctionMethod),
            participation: randomEnum(AuctionParticipation),
            auctionDate,
            endDate: faker.date.future({ refDate: auctionDate }),
            tenant: { connect: { id: entityStore.tenantId } },
            auctioneer: { connect: { id: faker.helpers.arrayElement(entityStore.auctioneers) } },
            seller: { connect: { id: seller.id } },
            judicialProcess: judicialProcessId ? { connect: { id: judicialProcessId } } : undefined,
        };
        const result = await services.auctionService.createAuction(auctionData);

        if (!result.success || !result.auction) {
            console.error(`Falha ao criar leilão: ${result.message}`);
            continue;
        }
        const auction = result.auction;
        
        await services.auctionStageService.createAuctionStage({ auctionId: auction.id, name: '1ª Praça', startDate: auctionDate, endDate: new Date(auctionDate.getTime() + 3 * 24 * 60 * 60 * 1000) });
        await services.auctionStageService.createAuctionStage({ auctionId: auction.id, name: '2ª Praça', startDate: new Date(auctionDate.getTime() + 4 * 24 * 60 * 60 * 1000), endDate: new Date(auctionDate.getTime() + 7 * 24 * 60 * 60 * 1000) });

        const lotIds: bigint[] = [];
        const numLots = status === AuctionStatus.RASCUNHO ? 0 : faker.number.int({ min: 1, max: MAX_LOTS_PER_AUCTION });
        const availableAssets = entityStore.assets.filter(a => a.status === AssetStatus.DISPONIVEL);

        for (let j = 0; j < numLots; j++) {
            const assetsForLot = faker.helpers.arrayElements(availableAssets, { min: 1, max: MAX_ASSETS_PER_LOT });
            if (assetsForLot.length === 0) continue;

            const mainAsset = assetsForLot[0];
            assetsForLot.forEach(a => a.status = AssetStatus.LOTEADO);

            const lotStatus = status === AuctionStatus.ABERTO_PARA_LANCES ? Prisma.LotStatus.ABERTO_PARA_LANCES : (status === AuctionStatus.EM_BREVE ? Prisma.LotStatus.EM_BREVE : (status === AuctionStatus.ENCERRADO ? Prisma.LotStatus.ENCERRADO : Prisma.LotStatus.RASCUNHO));
            const initialPrice = faker.number.int({ min: 100, max: 50000 });
            
            const lotData: Prisma.LotCreateInput = {
                title: `Lote de ${faker.commerce.productName()}`,
                publicId: uuidv4(),
                slug: slugify(`Lote ${j+1} Leilão ${auction.id} ${uuidv4()}`),
                description: faker.lorem.sentence(),
                status: lotStatus,
                price: initialPrice,
                initialPrice,
                secondInitialPrice: initialPrice * 0.7,
                tenant: { connect: { id: entityStore.tenantId } },
                auction: { connect: { id: auction.id } },
                assets: { create: assetsForLot.map(a => ({ assetId: a.id, assignedBy: 'seed' })) },
                type: mainAsset.categoryId.toString(), // Simplificado para string
            };
            const lotResult = await services.lotService.createLot(lotData);
            if (lotResult.success && lotResult.lot) {
                lotIds.push(lotResult.lot.id);
                entityStore.lots.push({ id: lotResult.lot.id, status: lotStatus, auctionId: auction.id, initialPrice, assetIds: assetsForLot.map(a => a.id) });
            }
        }
        entityStore.auctions.push({ id: auction.id, status, auctionType, lotIds });
    }
    log(`${entityStore.auctions.length} leilões criados, com etapas e ${entityStore.lots.length} lotes.`, 1);
}

async function seedInteractions() {
    log('Fase 9: Interações (Lances, Arremates, Pagamentos)...', 0);
    const lotsForBidding = entityStore.lots.filter(l => [Prisma.LotStatus.ABERTO_PARA_LANCES, Prisma.LotStatus.ENCERRADO].includes(l.status));
    const bidderUsers = entityStore.users.filter(u => u.habilitation === UserHabilitationStatus.HABILITADO);

    if (lotsForBidding.length === 0 || bidderUsers.length < 2) {
        log('Lotes ou arrematantes insuficientes para criar interações.', 1);
        return;
    }

    for (const lot of lotsForBidding) {
        let currentPrice = lot.initialPrice;
        const numberOfBids = faker.number.int({ min: 5, max: MAX_BIDS_PER_LOT });
        let lastBidder: any = null;

        for (let i = 0; i < numberOfBids; i++) {
            const bidder = faker.helpers.arrayElement(bidderUsers);
            currentPrice += faker.number.int({ min: 50, max: 500 });
            await services.bidService.createBid({
                lotId: lot.id, auctionId: lot.auctionId, bidderId: bidder.id,
                amount: currentPrice,
                tenantId: entityStore.tenantId,
                bidderDisplay: bidder.email,
            });
            lastBidder = bidder;
        }

        if (lot.status === Prisma.LotStatus.ENCERRADO && lastBidder) {
            const winResult = await services.userWinService.createUserWin({
                userId: lastBidder.id,
                lotId: lot.id,
                winningBidAmount: currentPrice,
                winDate: new Date(),
                paymentStatus: Prisma.PaymentStatus.PENDENTE,
            });

            if (winResult.success && winResult.userWin) {
                await prisma.lot.update({ where: { id: lot.id }, data: { status: Prisma.LotStatus.VENDIDO, winnerId: lastBidder.id } });
                entityStore.userWins.push(winResult.userWin.id);

                const numInstallments = faker.number.int({ min: 1, max: 6 });
                const paymentResult = await services.installmentPaymentService.createInstallmentsForWin(winResult.userWin, numInstallments);

                if (paymentResult.success && paymentResult.payments.length > 0) {
                    const paymentScenario = faker.helpers.arrayElement(['full', 'partial', 'none']);
                    if (paymentScenario === 'full') {
                        for (const p of paymentResult.payments) {
                            await services.installmentPaymentService.updatePaymentStatus(p.id, Prisma.PaymentStatus.PAGO);
                        }
                    } else if (paymentScenario === 'partial') {
                        const paidCount = faker.number.int({ min: 1, max: paymentResult.payments.length - 1 });
                        for (let i = 0; i < paidCount; i++) {
                            await services.installmentPaymentService.updatePaymentStatus(paymentResult.payments[i].id, Prisma.PaymentStatus.PAGO);
                        }
                    }
                }
            }
        }
    }
    const bidCount = await prisma.bid.count();
    log(`${bidCount} lances criados.`, 1);
    log(`${entityStore.userWins.length} lotes arrematados com pagamentos gerados.`, 1);
}

async function seedPostAuctionInteractions() {
    log('Fase 10: Interações Pós-Leilão (Vendas Diretas, Perguntas, Avaliações)...', 0);
    const unsoldLots = entityStore.lots.filter(l => l.status === Prisma.LotStatus.NAO_VENDIDO || l.status === Prisma.LotStatus.ENCERRADO);
    const users = entityStore.users.filter(u => u.habilitation === UserHabilitationStatus.HABILITADO);

    if (users.length === 0) return;

    for (const lot of unsoldLots) {
        if (faker.datatype.boolean(0.3)) {
            await services.directSaleOfferService.createDirectSaleOffer({
                title: `Oferta para ${lot.id}`,
                publicId: uuidv4(),
                price: lot.initialPrice * 0.9,
                tenantId: entityStore.tenantId,
                sellerId: faker.helpers.arrayElement(entityStore.sellers).id,
                categoryId: faker.helpers.arrayElement(entityStore.categories).id,
            });
        }
    }
    log(`Ofertas de venda direta criadas.`, 1);

    for (const lot of entityStore.lots) {
        if (faker.datatype.boolean(0.5)) {
            const question = await services.lotQuestionService.createQuestion({
                lotId: lot.id,
                auctionId: lot.auctionId,
                userId: faker.helpers.arrayElement(users).id,
                userDisplayName: faker.person.fullName(),
                questionText: faker.lorem.sentence() + '?',
            });
            if (question.success && question.question) {
                await services.lotQuestionService.addAnswer({
                    questionId: question.question.id,
                    answerText: faker.lorem.sentence(),
                    answeredByUserId: entityStore.users[0].id.toString(),
                    answeredByUserDisplayName: 'Admin',
                });
            }
        }
    }
    log(`Perguntas e respostas criadas nos lotes.`, 1);

    for (const winId of entityStore.userWins) {
        const win = await prisma.userWin.findUnique({ where: { id: winId }, include: { lot: true } });
        if (win && faker.datatype.boolean(0.6)) {
            await services.reviewService.createReview({
                lotId: win.lotId,
                auctionId: win.lot.auctionId,
                userId: win.userId,
                rating: faker.number.int({ min: 3, max: 5 }),
                comment: faker.lorem.paragraph(),
                userDisplayName: faker.person.fullName(),
            });
        }
    }
    log(`Avaliações criadas para lotes arrematados.`, 1);
}

async function seedMiscData() {
    log('Fase 11: Dados Diversos (Mensagens, etc)...', 0);

    for (let i = 0; i < 5; i++) {
        await services.contactMessageService.createMessage({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            subject: faker.lorem.sentence(),
            message: faker.lorem.paragraph(),
        });
    }
    log('5 mensagens de contato criadas.', 1);

    await services.documentTemplateService.upsertTemplate({
        name: 'Termo de Arrematação Padrão',
        type: 'WINNING_BID_TERM',
        content: `<h1>Termo de Arrematação</h1><p>Pelo presente instrumento, o arrematante <strong>{{winnerName}}</strong> arrematou o lote <strong>{{lotNumber}} - {{lotTitle}}</strong>...</p>`
    });
    log("Template 'Termo de Arrematação Padrão' garantido.", 1);
}

async function logSummary() {
    const counts = {
      users: await prisma.user.count(),
      categories: await prisma.lotCategory.count(),
      mediaItems: await prisma.mediaItem.count(),
      assets: await prisma.asset.count(),
      auctions: await prisma.auction.count(),
      lots: await prisma.lot.count(),
      bids: await prisma.bid.count(),
      wins: await prisma.userWin.count(),
    };
    console.log('\nResumo do Seeding:');
    console.log(`- Tenant: ${entityStore.tenantId}`);
    console.log(`- Usuários: ${counts.users} (Admin + Arrematantes)`);
    console.log(`- Categorias: ${counts.categories}`);
    console.log(`- Itens de Mídia: ${counts.mediaItems}`);
    console.log(`- Ativos (Bens): ${counts.assets}`);
    console.log(`- Leilões: ${counts.auctions}`);
    console.log(`- Lotes: ${counts.lots}`);
    console.log(`- Lances: ${counts.bids}`);
    console.log(`- Arremates: ${counts.wins}`);
    console.log('=====================================================\n');
}

main();
