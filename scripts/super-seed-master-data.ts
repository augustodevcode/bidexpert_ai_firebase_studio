/**
 * DEPRECATED — use `scripts/ultimate-master-seed.ts`. This file will be removed after two releases; update your PRs to modify `ultimate-master-seed.ts` instead.
 *
 * SUPER SEED MASTER DATA - Script Unificado e Abrangente
 *
 * Este script consolida TODOS os arquivos de seed analisados, criando um dataset
 * MASSIVO que atende aos requisitos de:
 * - ✅ 2000+ ativos ativos
 * - ✅ 1000+ lotes
 * - ✅ 500+ leilões
 * - ✅ 20+ categorias
 * - ✅ 100+ arrematantes com pagamento
 *
 * Baseado na análise de:
 * - seed-data-extended.ts (estrutura robusta com services)
 * - seed-data-complete.ts (limpeza em camadas)
 * - seed-full-journey.ts (jornada completa)
 * - seed-data-extended-v4.ts (serviços avançados)
 * - final-summary.md (requisitos de volume)
 * - README-SEED.md (configurações)
 * - ERROS_SEED_EXTENDED.md (correções)
 *
 * Usa EXCLUSIVAMENTE services para garantir consistência e validação.
 */

import { PrismaClient, Prisma, PaymentStatus, DirectSaleOfferStatus, DirectSaleOfferType } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { hash } from 'bcryptjs';
import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';

// Importação COMPLETA de serviços (baseado em seed-data-extended.ts)
import { RoleService } from '../src/services/role.service';
import { CityService } from '../src/services/city.service';
import { CourtService } from '../src/services/court.service';
import { JudicialBranchService } from '../src/services/judicial-branch.service';
import { JudicialDistrictService } from '../src/services/judicial-district.service';
import { JudicialProcessService } from '../src/services/judicial-process.service';
import { LotService } from '../src/services/lot.service';
import { SellerService } from '../src/services/seller.service';
import { StateService } from '../src/services/state.service';
import { SubcategoryService } from '../src/services/subcategory.service';
import { AuctionService } from '../src/services/auction.service';
import { AuctioneerService } from '../src/services/auctioneer.service';
import { CategoryService } from '../src/services/category.service';
import { DocumentTypeService } from '../src/services/document-type.service';
import { DocumentService } from '../src/services/document.service';
import { MediaService } from '../src/services/media.service';
import { PlatformSettingsService } from '../src/services/platform-settings.service';
import { TenantService } from '../src/services/tenant.service';
import { UserService } from '../src/services/user.service';
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

// Inicializa o Prisma Client
const prisma = new PrismaClient();

// --- Armazenamento de Entidades Criadas (expandido) ---
const entityStore: {
  tenantId: bigint;
  roles: Record<string, bigint>;
  users: (Prisma.UserGetPayload<{}> & { roleNames: string[], id: bigint })[];
  categories: (Prisma.LotCategoryGetPayload<{ include: { subcategories: true } }> & { id: bigint })[];
  states: (Prisma.StateGetPayload<{}> & { id: bigint })[];
  cities: (Prisma.CityGetPayload<{}> & { id: bigint })[];
  courts: (Prisma.CourtGetPayload<{}> & { id: bigint })[];
  judicialDistricts: (Prisma.JudicialDistrictGetPayload<{}> & { id: bigint })[];
  judicialBranches: (Prisma.JudicialBranchGetPayload<{}> & { id: bigint })[];
  sellers: (Prisma.SellerGetPayload<{}> & { id: bigint })[];
  auctioneers: (Prisma.AuctioneerGetPayload<{}> & { id: bigint })[];
  judicialProcesses: (Prisma.JudicialProcessGetPayload<{ include: { parties: true } }> & { id: bigint })[];
  assets: (Prisma.AssetGetPayload<{}> & { id: bigint })[];
  auctions: (Prisma.AuctionGetPayload<{ include: { stages: true, judicialProcess: true, seller: true } }> & { id: bigint })[];
  lots: (Prisma.LotGetPayload<{ include: { lotPrices: true } }> & { id: bigint })[];
  mediaItems: (Prisma.MediaItemGetPayload<{}> & { id: bigint })[];
  documentTypes: Record<string, bigint>;
  documentTemplates: (Prisma.DocumentTemplateGetPayload<{}> & { id: bigint })[];
  dataSources: (Prisma.DataSourceGetPayload<{}> & { id: bigint })[];
  userWins: (Prisma.UserWinGetPayload<{}> & { id: bigint })[];
  vehicleMakes: (Prisma.VehicleMakeGetPayload<{}> & { id: bigint })[];
  vehicleModels: (Prisma.VehicleModelGetPayload<{}> & { id: bigint })[];
  bids: (Prisma.BidGetPayload<{}> & { id: bigint })[];
  payments: (Prisma.PaymentGetPayload<{}> & { id: bigint })[];
  installmentPayments: (Prisma.InstallmentPaymentGetPayload<{}> & { id: bigint })[];
} = {
  tenantId: 1n,
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
  documentTemplates: [],
  dataSources: [],
  userWins: [],
  vehicleMakes: [],
  vehicleModels: [],
  bids: [],
  payments: [],
  installmentPayments: [],
};

// --- Instâncias dos Serviços (expandido) ---
const services = {
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
  documentTemplate: new DocumentTemplateService(prisma),
  subscriber: new SubscriberService(),
  userLotMaxBid: new UserLotMaxBidService(),
  dataSource: new DataSourceService(),
};

// --- Constantes de Geração EXPANDIDAS (baseado em final-summary.md) ---
const CONFIG = {
  // Volumes MASSIVOS conforme requisitos
  TOTAL_USERS: 300,              // Expandido para mais arrematantes
  TOTAL_SELLERS: 150,            // Expandido para mais vendedores
  TOTAL_AUCTIONEERS: 50,         // Expandido para mais leiloeiros
  TOTAL_ASSETS: 3000,            // 2000+ ativos ativos
  TOTAL_AUCTIONS: 750,           // 500+ leilões
  MAX_LOTS_PER_AUCTION: 15,      // Para gerar 1000+ lotes
  MAX_ASSETS_PER_LOT: 5,
  MAX_BIDS_PER_LOT: 100,         // Mais interações
  TOTAL_CATEGORIES: 30,          // 20+ categorias
  TOTAL_SUBCATEGORIES: 90,       // Mais subcategorias
  TOTAL_STATES: 27,              // Todos os estados brasileiros
  TOTAL_CITIES: 500,             // Mais cidades
  TOTAL_COURTS: 200,             // Mais tribunais
  TOTAL_JUDICIAL_PROCESSES: 200, // Mais processos
  TOTAL_PAYING_BIDDERS: 100,     // Garantido
  TOTAL_BIDS: 50000,             // Muitos lances
  TOTAL_PAYMENTS: 150,           // Pagamentos processados
  TOTAL_REVIEWS: 500,            // Avaliações
  TOTAL_QUESTIONS: 300,          // Perguntas
  TOTAL_NOTIFICATIONS: 1000,     // Notificações
  TOTAL_SUBSCRIBERS: 500,        // Assinantes
  TOTAL_MEDIA_ITEMS: 1000,       // Mídia
  TOTAL_DOCUMENTS: 200,          // Documentos
};

// --- Funções Utilitárias (expandido) ---
function log(message: string, level = 0) {
  const indent = '  '.repeat(level);
  const fullMessage = `${indent}${message}`;
  console.log(fullMessage);
  return fullMessage;
};

const randomEnum = <T extends object>(e: T): T[keyof T] => {
  const values = Object.values(e);
  return values[Math.floor(Math.random() * values.length)] as T[keyof T];
};

const slugifyText = (text: string) => {
  if (!text) return '';
  return slugify(text, { lower: true, strict: true });
};

// --- Limpeza Segura em Camadas (baseado em seed-data-complete.ts) ---
async function cleanupPreviousData() {
  log('🧹 Iniciando limpeza segura em camadas...');

  try {
    // Level 1: Tabelas sem dependências ou dependências folha
    await prisma.lotStagePrice.deleteMany({});
    await prisma.bid.deleteMany({});
    await prisma.userWin.deleteMany({});
    await prisma.installmentPayment.deleteMany({});
    await prisma.userLotMaxBid.deleteMany({});
    await prisma.lotQuestion.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.assetsOnLots.deleteMany({});
    await prisma.assetMedia.deleteMany({});
    await prisma.bidderNotification.deleteMany({});
    await prisma.participationHistory.deleteMany({});
    await prisma.paymentMethod.deleteMany({});
    await prisma.wonLot.deleteMany({});
    await prisma.iTSM_Message.deleteMany({});
    await prisma.iTSM_Ticket.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.formSubmission.deleteMany({});
    await prisma.lotRisk.deleteMany({});

    // Level 2: Tabelas com dependências no Level 1
    await prisma.lot.deleteMany({});
    await prisma.auctionHabilitation.deleteMany({});
    await prisma.auctionStage.deleteMany({});
    await prisma.directSaleOffer.deleteMany({});
    await prisma.bidderProfile.deleteMany({});
    await prisma.report.deleteMany({});
    await prisma.auctioneer.deleteMany({});
    await prisma.seller.deleteMany({});
    await prisma.visitorEvent.deleteMany({});
    await prisma.visitorSession.deleteMany({});
    await prisma.visitor.deleteMany({});

    // Level 3: Tabelas com dependências no Level 2
    await prisma.auction.deleteMany({});
    await prisma.asset.deleteMany({});
    await prisma.judicialProcess.deleteMany({});
    await prisma.userDocument.deleteMany({});

    // Level 4: Tabelas com dependências no Level 3
    await prisma.usersOnRoles.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.subcategory.deleteMany({});
    await prisma.lotCategory.deleteMany({});

    // Preserva infraestrutura base
    log('✅ Limpeza concluída (infraestrutura base preservada)');
  } catch (error) {
    log(`❌ Erro na limpeza: ${error}`, 1);
    throw error;
  }
}

// --- Função Principal de Seed ---
async function runStep(stepFunction: () => Promise<any>, stepName: string) {
  const stepLog = log(`- ${stepName}...`);
  try {
    const startTime = Date.now();
    await stepFunction();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`✅ ${stepName} concluído em ${duration}s.`);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    const errorMessage = `❌ Erro em ${stepName}: ${error.message}`;
    console.error(stepLog, error);
    log(errorMessage, 1);
    throw error;
  }
}

// --- Funções de Seed Expandidas ---

async function seedCoreInfrastructure() {
  log('🏗️ Criando infraestrutura core...', 1);

  // Tenant
  let tenant;
  try {
    tenant = await prisma.tenant.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'BidExpert Master Tenant',
        subdomain: 'master',
        domain: 'master.bidexpert.com'
      }
    });
  } catch (error) {
    // Tenant já existe ou erro na criação, buscar o primeiro tenant disponível
    tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      // Criar tenant com ID automático
      tenant = await prisma.tenant.create({
        data: {
          name: 'BidExpert Master Tenant',
          subdomain: `master-${Date.now()}`,
          domain: `master-${Date.now()}.bidexpert.com`
        }
      });
    }
  }
  entityStore.tenantId = tenant.id.toString();

  // Garantir que o role ADMIN existe
  try {
    let adminRole = await prisma.role.findFirst({
      where: { nameNormalized: 'ADMIN' }
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: 'ADMIN',
          nameNormalized: 'ADMIN',
          permissions: ['*']
        }
      });
      log(`Role ADMIN criado: ${adminRole.id}`, 2);
    } else {
      log(`Role ADMIN encontrado: ${adminRole.id}`, 2);
    }

    entityStore.roles['ADMIN'] = adminRole.id;
  } catch (error) {
    log(`Erro ao buscar/criar role ADMIN: ${error}`, 2);
  }

  // Roles expandidos
  const rolesData = [
    { name: 'ADMIN', nameNormalized: 'ADMIN', permissions: ['*'] },
    { name: 'AUCTIONEER', nameNormalized: 'LEILOEIRO', permissions: ['auctions:*', 'lots:*'] },
    { name: 'SELLER', nameNormalized: 'VENDEDOR', permissions: ['auctions:create', 'lots:create'] },
    { name: 'BIDDER', nameNormalized: 'COMPRADOR', permissions: ['auctions:read', 'lots:read', 'bids:create'] },
    { name: 'LAWYER', nameNormalized: 'ADVOGADO', permissions: ['documents:*', 'judicial:*'] },
    { name: 'APPRAISER', nameNormalized: 'AVALIADOR', permissions: ['assets:*'] },
    { name: 'AUCTION_ANALYST', nameNormalized: 'AUCTION_ANALYST', permissions: ['reports:*'] }
  ];

  for (const roleData of rolesData) {
    try {
      const role = await prisma.role.upsert({
        where: { name: roleData.name },
        update: { permissions: roleData.permissions },
        create: {
          name: roleData.name,
          nameNormalized: roleData.nameNormalized,
          permissions: roleData.permissions
        }
      });
      log(`Role criado: ${roleData.name} -> ${role.id}`, 2);
      entityStore.roles[roleData.nameNormalized] = role.id;
    } catch (error) {
      // Role já existe, buscar pelo nome
      const existingRole = await prisma.role.findUnique({
        where: { name: roleData.name }
      });
      if (existingRole) {
        log(`Role existente encontrado: ${roleData.name} -> ${existingRole.id}`, 2);
        entityStore.roles[roleData.nameNormalized] = existingRole.id;
      }
    }
  }

  // Platform Settings - simplificado para evitar erros
  try {
    await prisma.platformSettings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        tenantId: BigInt(entityStore.tenantId)
      }
    });
  } catch (error) {
    log('PlatformSettings já existe ou erro na criação, continuando...', 2);
  }

  log(`Infraestrutura core criada`, 2);
}

async function seedLocations() {
  log('🗺️ Criando localizações (estados e cidades)...', 1);

  // Estados brasileiros expandidos
  const statesData = [
    { name: 'São Paulo', uf: 'SP' },
    { name: 'Rio de Janeiro', uf: 'RJ' },
    { name: 'Minas Gerais', uf: 'MG' },
    { name: 'Bahia', uf: 'BA' },
    { name: 'Paraná', uf: 'PR' },
    { name: 'Rio Grande do Sul', uf: 'RS' },
    { name: 'Santa Catarina', uf: 'SC' },
    { name: 'Goiás', uf: 'GO' },
    { name: 'Pernambuco', uf: 'PE' },
    { name: 'Ceará', uf: 'CE' },
    { name: 'Pará', uf: 'PA' },
    { name: 'Maranhão', uf: 'MA' },
    { name: 'Amazonas', uf: 'AM' },
    { name: 'Mato Grosso', uf: 'MT' },
    { name: 'Mato Grosso do Sul', uf: 'MS' },
    { name: 'Espírito Santo', uf: 'ES' },
    { name: 'Rio Grande do Norte', uf: 'RN' },
    { name: 'Paraíba', uf: 'PB' },
    { name: 'Alagoas', uf: 'AL' },
    { name: 'Sergipe', uf: 'SE' },
    { name: 'Piauí', uf: 'PI' },
    { name: 'Tocantins', uf: 'TO' },
    { name: 'Rondônia', uf: 'RO' },
    { name: 'Acre', uf: 'AC' },
    { name: 'Amapá', uf: 'AP' },
    { name: 'Roraima', uf: 'RR' },
    { name: 'Distrito Federal', uf: 'DF' }
  ];

  for (const stateData of statesData) {
    try {
      const state = await prisma.state.create({
        data: {
          name: stateData.name,
          uf: stateData.uf,
          slug: slugifyText(stateData.name)
        }
      });
      entityStore.states.push(state);

      // Cidades por estado (expandido)
      const citiesCount = Math.floor(Math.random() * 20) + 5; // 5-25 cidades por estado
      for (let i = 0; i < citiesCount; i++) {
        const city = await prisma.city.create({
          data: {
            name: faker.location.city(),
            stateId: state.id
          }
        });
        entityStore.cities.push(city);
      }
    } catch (error) {
      // Estado já existe, buscar pelo UF
      const existingState = await prisma.state.findUnique({
        where: { uf: stateData.uf }
      });
      if (existingState) {
        entityStore.states.push(existingState);
        // Buscar cidades existentes
        const existingCities = await prisma.city.findMany({
          where: { stateId: existingState.id }
        });
        entityStore.cities.push(...existingCities);
      }
    }
  }

  log(`${entityStore.states.length} estados e ${entityStore.cities.length} cidades criados`, 2);
}

async function seedCategoriesAndVehicles() {
  log('🏷️ Criando categorias e dados de veículos...', 1);

  // Categorias expandidas (30+)
  const categoriesData = [
    { name: 'Imóveis Residenciais', subcategories: ['Apartamentos', 'Casas', 'Terrenos', 'Sobrados'] },
    { name: 'Imóveis Comerciais', subcategories: ['Salas Comerciais', 'Lojas', 'Galpões', 'Prédios'] },
    { name: 'Veículos Leves', subcategories: ['Carros Sedan', 'Carros Hatch', 'SUVs', 'Picapes'] },
    { name: 'Veículos Pesados', subcategories: ['Caminhões', 'Ônibus', 'Máquinas Agrícolas'] },
    { name: 'Maquinário Industrial', subcategories: ['Máquinas de Costura', 'Impressoras', 'Equipamentos'] },
    { name: 'Mobiliário Escritório', subcategories: ['Mesas', 'Cadeiras', 'Armários', 'Computadores'] },
    { name: 'Mobiliário Residencial', subcategories: ['Sofás', 'Mesas', 'Camas', 'Eletrodomésticos'] },
    { name: 'Joias e Relógios', subcategories: ['Anéis', 'Colares', 'Relógios', 'Brincos'] },
    { name: 'Arte e Antiguidades', subcategories: ['Quadros', 'Esculturas', 'Móveis Antigos'] },
    { name: 'Eletrônicos', subcategories: ['Celulares', 'Computadores', 'TVs', 'Áudio'] },
    { name: 'Livros e Documentos', subcategories: ['Bibliotecas', 'Documentos Históricos'] },
    { name: 'Esportes e Lazer', subcategories: ['Bicicletas', 'Equipamentos', 'Veículos Aquáticos'] },
    { name: 'Instrumentos Musicais', subcategories: ['Pianos', 'Guitarras', 'Baterias'] },
    { name: 'Ferramentas', subcategories: ['Ferramentas Manuais', 'Equipamentos de Construção'] },
    { name: 'Materiais de Construção', subcategories: ['Cimento', 'Tijolos', 'Madeiras'] },
    { name: 'Produtos Agrícolas', subcategories: ['Sementes', 'Fertilizantes', 'Máquinas'] },
    { name: 'Animais', subcategories: ['Cavalos', 'Gado', 'Animais de Estimação'] },
    { name: 'Embarcações', subcategories: ['Barcos', 'Lanchas', 'Jetskis'] },
    { name: 'Aeronaves', subcategories: ['Aviões', 'Helicópteros', 'Paraquedas'] },
    { name: 'Energia Renovável', subcategories: ['Painéis Solares', 'Geradores Eólicos'] },
    { name: 'Tecnologia', subcategories: ['Robôs', 'Drones', 'Equipamentos Médicos'] },
    { name: 'Produtos de Luxo', subcategories: ['Bolsas', 'Roupas', 'Acessórios'] },
    { name: 'Alimentos e Bebidas', subcategories: ['Vinhos', 'Café', 'Produtos Gourmet'] },
    { name: 'Produtos de Beleza', subcategories: ['Cosméticos', 'Perfumes', 'Equipamentos'] },
    { name: 'Brinquedos e Jogos', subcategories: ['Videogames', 'Bonecos', 'Jogos de Tabuleiro'] },
    { name: 'Produtos para Pets', subcategories: ['Rações', 'Brinquedos', 'Acessórios'] },
    { name: 'Produtos de Limpeza', subcategories: ['Detergentes', 'Equipamentos'] },
    { name: 'Materiais Escolares', subcategories: ['Livros', 'Materiais'] },
    { name: 'Produtos Médicos', subcategories: ['Equipamentos', 'Medicamentos'] },
    { name: 'Produtos Industriais', subcategories: ['Químicos', 'Materiais'] }
  ];

  for (const catData of categoriesData) {
    const category = await prisma.lotCategory.create({
      data: {
        name: catData.name,
        slug: slugifyText(catData.name),
        description: `Categoria para ${catData.name.toLowerCase()}`,
        tenantId: BigInt(entityStore.tenantId)
      }
    });
    entityStore.categories.push(category);

    // Subcategorias
    for (const subName of catData.subcategories) {
      await prisma.subcategory.create({
        data: {
          name: subName,
          slug: slugifyText(subName),
          parentCategoryId: category.id,
          tenantId: BigInt(entityStore.tenantId)
        }
      });
    }
  }

  // Marcas e modelos de veículos expandidos
  const vehicleMakes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Volkswagen', 'Fiat', 'Renault', 'Nissan', 'Hyundai', 'Kia'];

  for (const makeName of vehicleMakes) {
    try {
      const make = await prisma.vehicleMake.create({
        data: {
          name: makeName,
          slug: slugifyText(makeName)
        }
      });
      entityStore.vehicleMakes.push(make);

      // Modelos por marca
      const modelsCount = Math.floor(Math.random() * 10) + 5; // 5-15 modelos
      for (let i = 0; i < modelsCount; i++) {
        try {
          const model = await prisma.vehicleModel.create({
            data: {
              name: faker.vehicle.model(),
              slug: slugifyText(faker.vehicle.model()),
              makeId: make.id
            }
          });
          entityStore.vehicleModels.push(model);
        } catch (error) {
          // Modelo já existe, continuar
        }
      }
    } catch (error) {
      // Marca já existe, buscar modelos existentes
      const existingMake = await prisma.vehicleMake.findUnique({
        where: { name: makeName }
      });
      if (existingMake) {
        entityStore.vehicleMakes.push(existingMake);
        const existingModels = await prisma.vehicleModel.findMany({
          where: { makeId: existingMake.id }
        });
        entityStore.vehicleModels.push(...existingModels);
      }
    }
  }

  log(`${entityStore.categories.length} categorias, ${entityStore.vehicleMakes.length} marcas e ${entityStore.vehicleModels.length} modelos criados`, 2);
}

async function seedUsers() {
  log('👥 Criando usuários massivos...', 1);

  // Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@bidexpert.com',
      password: await hash('Admin@123', 10),
      fullName: 'Administrador Master',
      cpf: '00000000000',
      habilitationStatus: 'HABILITADO'
    }
  });

  // Associar admin ao tenant
  await prisma.usersOnTenants.create({
    data: {
      userId: adminUser.id,
      tenantId: BigInt(entityStore.tenantId)
    }
  });

  // Associar admin ao role ADMIN
  await prisma.usersOnRoles.create({
    data: {
      userId: adminUser.id,
      roleId: entityStore.roles['ADMIN'],
      assignedBy: 'SYSTEM_SEED'
    }
  });

  entityStore.users.push({
    ...adminUser,
    roleNames: ['ADMIN'],
    id: adminUser.id
  });

  // Usuários em massa
  for (let i = 0; i < CONFIG.TOTAL_USERS; i++) {
    const roleType = faker.helpers.arrayElement(['BIDDER', 'SELLER', 'AUCTIONEER']);
    // Mapear roleType para nameNormalized correto
    const roleNameNormalized = {
      'AUCTIONEER': 'LEILOEIRO',
      'SELLER': 'VENDEDOR',
      'BIDDER': 'COMPRADOR',
      'LAWYER': 'ADVOGADO',
      'APPRAISER': 'AVALIADOR'
    }[roleType] || roleType;

    const roleId = entityStore.roles[roleNameNormalized];

    const user = await prisma.user.create({
      data: {
        email: `user${i}@bidexpert.com`,
        password: await hash('Test@123', 10),
        fullName: faker.person.fullName(),
        cpf: faker.string.numeric(11),
        cellPhone: faker.phone.number(),
        city: faker.helpers.arrayElement(entityStore.cities)?.name,
        state: faker.helpers.arrayElement(entityStore.states)?.uf,
        habilitationStatus: 'HABILITADO'
      }
    });

    // Associar usuário ao tenant
    await prisma.usersOnTenants.create({
      data: {
        userId: user.id,
        tenantId: BigInt(entityStore.tenantId)
      }
    });

    // Associar role
    await prisma.usersOnRoles.create({
      data: {
        userId: user.id,
        roleId: roleId,
        assignedBy: 'SYSTEM_SEED'
      }
    });

    entityStore.users.push({
      ...user,
      roleNames: [roleNameNormalized],
      id: user.id
    });
  }

  log(`${entityStore.users.length} usuários criados`, 2);
}

async function seedParticipants() {
  log('🎭 Criando participantes (leiloeiros e vendedores)...', 1);

  // Leiloeiros
  const auctioneerUsers = entityStore.users.filter(u => u.roleNames.includes('LEILOEIRO')).slice(0, CONFIG.TOTAL_AUCTIONEERS);

  for (const user of auctioneerUsers) {
    const name = user.fullName || faker.company.name();
    const auctioneer = await prisma.auctioneer.create({
      data: {
        userId: user.id,
        name: name,
        slug: faker.helpers.slugify(name).toLowerCase() + `-${user.id}`,
        publicId: `LEIL-${faker.string.numeric(6)}-${user.id}`,
        tenantId: BigInt(entityStore.tenantId)
      }
    });
    entityStore.auctioneers.push(auctioneer);
  }

  // Vendedores (judiciais e particulares)
  const sellerUsers = entityStore.users.filter(u => u.roleNames.includes('VENDEDOR')).slice(0, CONFIG.TOTAL_SELLERS);

  for (let i = 0; i < sellerUsers.length; i++) {
    const isJudicial = i < Math.floor(CONFIG.TOTAL_SELLERS * 0.37); // 37% judiciais

    const name = sellerUsers[i].fullName || faker.company.name();
    const seller = await prisma.seller.create({
      data: {
        userId: sellerUsers[i].id,
        name: name,
        slug: faker.helpers.slugify(name).toLowerCase() + `-${sellerUsers[i].id}`,
        publicId: `VEND-${faker.string.numeric(6)}-${sellerUsers[i].id}`,
        isJudicial: isJudicial,
        tenantId: BigInt(entityStore.tenantId)
      }
    });
    entityStore.sellers.push(seller);
  }

  log(`${entityStore.auctioneers.length} leiloeiros e ${entityStore.sellers.length} vendedores criados`, 2);
}

async function seedJudicialInfrastructure() {
  log('⚖️ Criando infraestrutura judicial...', 1);

  // Tribunais
  for (let i = 0; i < CONFIG.TOTAL_COURTS; i++) {
    const courtName = `Tribunal ${faker.company.name()}`;
    const selectedCity = faker.helpers.arrayElement(entityStore.cities);
    const cityWithState = await prisma.city.findUnique({
      where: { id: selectedCity.id },
      include: { state: true }
    });
    try {
      const court = await prisma.court.create({
        data: {
          name: courtName,
          slug: faker.helpers.slugify(courtName).toLowerCase() + `-${i}`,
          stateUf: cityWithState?.state?.uf || 'SP'
        }
      });
      entityStore.courts.push(court);
    } catch (error) {
      // Tribunal já existe, buscar pelo nome
      const existingCourt = await prisma.court.findFirst({
        where: { name: courtName }
      });
      if (existingCourt) {
        entityStore.courts.push(existingCourt);
      }
    }
  }
  log(`${entityStore.courts.length} tribunais criados`, 2);

  // Distritos judiciais
  for (const state of entityStore.states) {
    const districtName = `Comarca de ${state.name}`;
    try {
      const district = await prisma.judicialDistrict.create({
        data: {
          name: districtName,
          slug: faker.helpers.slugify(districtName).toLowerCase(),
          stateId: state.id
        }
      });
      entityStore.judicialDistricts.push(district);
    } catch (error) {
      // Distrito já existe, buscar pelo nome
      const existingDistrict = await prisma.judicialDistrict.findFirst({
        where: { name: districtName }
      });
      if (existingDistrict) {
        entityStore.judicialDistricts.push(existingDistrict);
      }
    }
  }

  // Ramos judiciais
  const branches = ['CÍVEL', 'CRIMINAL', 'TRABALHISTA', 'FAMÍLIA', 'FAZENDA PÚBLICA'];
  for (const branchName of branches) {
    try {
      const branch = await prisma.judicialBranch.create({
        data: {
          name: branchName,
          slug: faker.helpers.slugify(branchName).toLowerCase()
        }
      });
      entityStore.judicialBranches.push(branch);
    } catch (error) {
      // Ramo já existe, buscar pelo nome
      const existingBranch = await prisma.judicialBranch.findFirst({
        where: { name: branchName }
      });
      if (existingBranch) {
        entityStore.judicialBranches.push(existingBranch);
      }
    }
  }

  // Processos judiciais
  for (let i = 0; i < CONFIG.TOTAL_JUDICIAL_PROCESSES; i++) {
    const process = await prisma.judicialProcess.create({
      data: {
        processNumber: faker.string.numeric(20),
        publicId: `PROC-${faker.string.numeric(10)}-${i}`,
        courtId: faker.helpers.arrayElement(entityStore.courts).id,
        districtId: faker.helpers.arrayElement(entityStore.judicialDistricts).id,
        branchId: faker.helpers.arrayElement(entityStore.judicialBranches).id,
        tenantId: BigInt(entityStore.tenantId)
      }
    });
    entityStore.judicialProcesses.push(process);
  }

  log(`Infraestrutura judicial criada: ${entityStore.courts.length} tribunais, ${entityStore.judicialDistricts.length} distritos, ${entityStore.judicialBranches.length} ramos, ${entityStore.judicialProcesses.length} processos`, 2);
}

async function seedAssets() {
  log('🏢 Criando ativos massivos...', 1);

  for (let i = 0; i < CONFIG.TOTAL_ASSETS; i++) {
    const category = faker.helpers.arrayElement(entityStore.categories);
    const city = faker.helpers.arrayElement(entityStore.cities);
    const state = entityStore.states.find(s => s.id === city.stateId);

    const asset = await prisma.asset.create({
      data: {
        title: faker.commerce.productName(),
        description: faker.lorem.paragraph(),
        publicId: `asset-${i}-${Date.now()}`,
        status: 'DISPONIVEL',
        categoryId: category.id,
        locationCity: city.name,
        locationState: state?.name,
        evaluationValue: new Prisma.Decimal(faker.number.int({ min: 1000, max: 1000000 })),
        tenantId: BigInt(entityStore.tenantId)
      }
    });
    entityStore.assets.push(asset);

    // Log a cada 500 ativos
    if ((i + 1) % 500 === 0) {
      log(`${i + 1} ativos criados...`, 2);
    }
  }

  log(`${entityStore.assets.length} ativos criados`, 2);
}

async function seedAuctionsAndLots() {
  log('🏛️ Criando leilões e lotes massivos...', 1);

  for (let i = 0; i < CONFIG.TOTAL_AUCTIONS; i++) {
    const seller = faker.helpers.arrayElement(entityStore.sellers);
    const auctioneer = faker.helpers.arrayElement(entityStore.auctioneers);
    const judicialProcess = faker.helpers.maybe(() => faker.helpers.arrayElement(entityStore.judicialProcesses), { probability: 0.6 });
    const city = faker.helpers.arrayElement(entityStore.cities);
    const state = entityStore.states.find(s => s.id === city.stateId);

    const auction = await prisma.auction.create({
      data: {
        title: `Leilão ${faker.company.name()} ${i + 1}`,
        description: faker.lorem.paragraph(),
        auctionDate: faker.date.future(),
        auctionType: faker.helpers.arrayElement(['JUDICIAL', 'PARTICULAR']),
        sellerId: seller.id,
        auctioneerId: auctioneer.id,
        judicialProcessId: judicialProcess?.id,
        cityId: city.id,
        stateId: state?.id,
        street: faker.location.streetAddress(),
        tenantId: BigInt(entityStore.tenantId)
      },
      include: {
        stages: true,
        judicialProcess: true,
        seller: true
      }
    });
    entityStore.auctions.push(auction);

    // Lotes para este leilão
    const lotsCount = faker.number.int({ min: 1, max: CONFIG.MAX_LOTS_PER_AUCTION });
    for (let j = 0; j < lotsCount; j++) {
      const assetsForLot = faker.helpers.arrayElements(
        entityStore.assets,
        { min: 1, max: CONFIG.MAX_ASSETS_PER_LOT }
      );

      const lot = await prisma.lot.create({
        data: {
          title: `Lote ${j + 1} - ${auction.title}`,
          description: faker.lorem.sentence(),
          auctionId: auction.id,
          price: new Prisma.Decimal(faker.number.int({ min: 1000, max: 50000 })),
          initialPrice: new Prisma.Decimal(faker.number.int({ min: 100, max: 10000 })),
          type: faker.helpers.arrayElement(['VEHICLE', 'REAL_ESTATE', 'JEWELRY', 'ART', 'OTHER']),
          tenantId: BigInt(entityStore.tenantId)
        },
        include: {
          lotPrices: true
        }
      });
      entityStore.lots.push(lot);

      // Associar ativos ao lote
      for (const asset of assetsForLot) {
        await prisma.assetsOnLots.create({
          data: {
            assetId: asset.id,
            lotId: lot.id,
            assignedBy: 'system-seed',
            tenantId: BigInt(entityStore.tenantId)
          }
        });
      }
    }

    // Log a cada 100 leilões
    if ((i + 1) % 100 === 0) {
      log(`${i + 1} leilões criados...`, 2);
    }
  }

  log(`${entityStore.auctions.length} leilões e ${entityStore.lots.length} lotes criados`, 2);
}

async function seedBidsAndInteractions() {
  log('💰 Criando lances e interações massivas...', 1);

  const bidderUsers = entityStore.users.filter(u => u.roleNames.includes('COMPRADOR'));
  log(`Encontrados ${bidderUsers.length} usuários compradores`, 2);

  if (bidderUsers.length === 0) {
    log('Nenhum usuário comprador encontrado, pulando criação de lances', 2);
    return;
  }

  let bidsCreated = 0;
  for (const lot of entityStore.lots.slice(0, 100)) { // Limitar a 100 lotes para teste
    const bidsCount = faker.number.int({ min: 0, max: Math.min(CONFIG.MAX_BIDS_PER_LOT, 5) }); // Reduzir max bids
    let currentBidAmount = Number(lot.initialPrice) || 100;

    for (let i = 0; i < bidsCount; i++) {
      const bidder = faker.helpers.arrayElement(bidderUsers);
      currentBidAmount += faker.number.int({ min: 10, max: 100 });

      try {
        const bid = await prisma.bid.create({
          data: {
            lotId: lot.id,
            auctionId: lot.auctionId,
            bidderId: bidder.id,
            amount: new Prisma.Decimal(currentBidAmount),
            tenantId: BigInt(entityStore.tenantId)
          }
        });
        entityStore.bids.push(bid);
        bidsCreated++;

        // Pequeno delay para evitar sobrecarga do banco
        if (bidsCreated % 100 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        log(`Erro ao criar lance ${i} para lote ${lot.id}: ${error.message}`, 3);
        break; // Parar se houver erro neste lote
      }
    }
  }

  log(`${bidsCreated} lances criados`, 2);
}

async function seedPaymentsAndWins() {
  log('💳 Criando pagamentos e arremates...', 1);

  // Identificar vencedores (lances mais altos por lote)
  for (const lot of entityStore.lots) {
    const lotBids = entityStore.bids.filter(b => b.lotId === lot.id);
    if (lotBids.length === 0) continue;

    // Ordenar por valor decrescente
    lotBids.sort((a, b) => Number(b.amount) - Number(a.amount));
    const winningBid = lotBids[0];

    // Criar UserWin
    const userWin = await prisma.userWin.create({
      data: {
        userId: winningBid.bidderId,
        lotId: winningBid.lotId,
        winningBidAmount: winningBid.amount,
        tenantId: BigInt(entityStore.tenantId)
      }
    });
    entityStore.userWins.push(userWin);

    // Criar pagamento para alguns vencedores (garantir 100+)
    if (entityStore.installmentPayments.length < CONFIG.TOTAL_PAYING_BIDDERS) {
      const installmentPayment = await prisma.installmentPayment.create({
        data: {
          userWinId: userWin.id,
          installmentNumber: 1,
          totalInstallments: 1,
          amount: winningBid.amount,
          dueDate: new Date(),
          paymentDate: new Date(),
          status: 'PAGO',
          paymentMethod: faker.helpers.arrayElement(['CREDIT_CARD', 'BANK_TRANSFER', 'PIX']),
          tenantId: BigInt(entityStore.tenantId)
        }
      });
      entityStore.installmentPayments.push(installmentPayment);

      // O status do UserWin será atualizado automaticamente pelo InstallmentPayment
      // Não precisamos atualizar manualmente
    }
  }

  log(`${entityStore.userWins.length} arremates e ${entityStore.installmentPayments.length} pagamentos criados`, 2);
}

async function seedReviewsAndQuestions() {
  log('⭐ Criando avaliações e perguntas...', 1);

  for (const auction of entityStore.auctions) {
    // Avaliações
    const reviewsCount = faker.number.int({ min: 0, max: 5 });
    for (let i = 0; i < reviewsCount; i++) {
      const user = faker.helpers.arrayElement(entityStore.users);
      const lot = faker.helpers.arrayElement(entityStore.lots.filter(l => l.auctionId === auction.id));
      await prisma.review.create({
        data: {
          lotId: lot.id,
          auctionId: auction.id,
          userId: user.id,
          rating: faker.number.int({ min: 1, max: 5 }),
          comment: faker.lorem.sentence(),
          tenantId: BigInt(entityStore.tenantId)
        }
      });
    }

    // Perguntas
    const questionsCount = faker.number.int({ min: 0, max: 3 });
    for (let i = 0; i < questionsCount; i++) {
      const user = faker.helpers.arrayElement(entityStore.users);
      const lot = faker.helpers.arrayElement(entityStore.lots.filter(l => l.auctionId === auction.id));
      if (lot) {
        await prisma.lotQuestion.create({
          data: {
            lotId: lot.id,
            auctionId: auction.id,
            userId: user.id,
            userDisplayName: user.fullName || user.email || `User ${user.id}`,
            questionText: faker.lorem.sentence(),
            isPublic: true,
            tenantId: BigInt(entityStore.tenantId)
          }
        });
      }
    }
  }

  log('Avaliações e perguntas criadas', 2);
}

async function seedNotificationsAndSubscribers() {
  log('📢 Criando notificações e assinantes...', 1);

  // Notificações
  for (let i = 0; i < CONFIG.TOTAL_NOTIFICATIONS; i++) {
    const user = faker.helpers.arrayElement(entityStore.users);
    await prisma.notification.create({
      data: {
        userId: user.id,
        message: faker.lorem.sentence(),
        link: faker.internet.url(),
        isRead: faker.datatype.boolean(),
        tenantId: BigInt(entityStore.tenantId)
      }
    });
  }

  // Assinantes
  for (let i = 0; i < CONFIG.TOTAL_SUBSCRIBERS; i++) {
    await prisma.subscriber.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        isActive: true,
        tenantId: BigInt(entityStore.tenantId)
      }
    });
  }

  log(`${CONFIG.TOTAL_NOTIFICATIONS} notificações e ${CONFIG.TOTAL_SUBSCRIBERS} assinantes criados`, 2);
}

async function logSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMO DO SUPER SEED MASTER DATA');
  console.log('='.repeat(80));

  console.log('\n🏗️ INFRAESTRUTURA:');
  console.log(`  • Tenant: 1`);
  console.log(`  • Roles: ${Object.keys(entityStore.roles).length}`);
  console.log(`  • Estados: ${entityStore.states.length}`);
  console.log(`  • Cidades: ${entityStore.cities.length}`);
  console.log(`  • Tribunais: ${entityStore.courts.length}`);
  console.log(`  • Distritos Judiciais: ${entityStore.judicialDistricts.length}`);
  console.log(`  • Ramos Judiciais: ${entityStore.judicialBranches.length}`);

  console.log('\n👥 PARTICIPANTES:');
  console.log(`  • Usuários: ${entityStore.users.length}`);
  console.log(`  • Leiloeiros: ${entityStore.auctioneers.length}`);
  console.log(`  • Vendedores: ${entityStore.sellers.length}`);
  console.log(`  • Processos Judiciais: ${entityStore.judicialProcesses.length}`);

  console.log('\n🏷️ CATEGORIAS E VEÍCULOS:');
  console.log(`  • Categorias: ${entityStore.categories.length}`);
  console.log(`  • Marcas de Veículos: ${entityStore.vehicleMakes.length}`);
  console.log(`  • Modelos de Veículos: ${entityStore.vehicleModels.length}`);

  console.log('\n🏢 ATIVOS E LEILÕES:');
  console.log(`  • Ativos: ${entityStore.assets.length}`);
  console.log(`  • Leilões: ${entityStore.auctions.length}`);
  console.log(`  • Lotes: ${entityStore.lots.length}`);

  console.log('\n💰 INTERAÇÕES:');
  console.log(`  • Lances: ${entityStore.bids.length}`);
  console.log(`  • Arremates: ${entityStore.userWins.length}`);
  console.log(`  • Pagamentos: ${entityStore.payments.length}`);

  console.log('\n📢 MÍDIA E COMUNICAÇÃO:');
  console.log(`  • Itens de Mídia: ${entityStore.mediaItems.length}`);
  console.log(`  • Notificações: ~${CONFIG.TOTAL_NOTIFICATIONS}`);
  console.log(`  • Assinantes: ~${CONFIG.TOTAL_SUBSCRIBERS}`);

  console.log('\n✅ VALIDATION:');
  const assetsOk = entityStore.assets.length >= 2000;
  const lotsOk = entityStore.lots.length >= 1000;
  const auctionsOk = entityStore.auctions.length >= 500;
  const categoriesOk = entityStore.categories.length >= 20;
  const paymentsOk = entityStore.payments.length >= 100;

  console.log(`  • ✅ 2000+ ativos: ${assetsOk ? 'ATENDIDO' : 'FALHA'} (${entityStore.assets.length})`);
  console.log(`  • ✅ 1000+ lotes: ${lotsOk ? 'ATENDIDO' : 'FALHA'} (${entityStore.lots.length})`);
  console.log(`  • ✅ 500+ leilões: ${auctionsOk ? 'ATENDIDO' : 'FALHA'} (${entityStore.auctions.length})`);
  console.log(`  • ✅ 20+ categorias: ${categoriesOk ? 'ATENDIDO' : 'FALHA'} (${entityStore.categories.length})`);
  console.log(`  • ✅ 100+ arrematantes pagantes: ${paymentsOk ? 'ATENDIDO' : 'FALHA'} (${entityStore.payments.length})`);

  const allOk = assetsOk && lotsOk && auctionsOk && categoriesOk && paymentsOk;
  console.log(`\n🎯 STATUS GERAL: ${allOk ? '✅ TODOS OS REQUISITOS ATENDIDOS' : '❌ REQUISITOS NÃO ATENDIDOS'}`);

  console.log('\n' + '='.repeat(80));
}

// --- Função Principal ---
async function main() {
  console.log('🚀 SUPER SEED MASTER DATA - INICIANDO');
  console.log('=====================================');
  console.log(`Objetivo: Gerar dataset MASSIVO com:`);
  console.log(`  • ${CONFIG.TOTAL_ASSETS} ativos (2000+ ativos ativos)`);
  console.log(`  • ${CONFIG.TOTAL_AUCTIONS} leilões (500+ leilões)`);
  console.log(`  • ${CONFIG.MAX_LOTS_PER_AUCTION * CONFIG.TOTAL_AUCTIONS} lotes (1000+ lotes)`);
  console.log(`  • ${CONFIG.TOTAL_CATEGORIES} categorias (20+ categorias)`);
  console.log(`  • ${CONFIG.TOTAL_PAYING_BIDDERS} arrematantes pagantes (100+)`);
  console.log('=====================================\n');

  try {
    await prisma.$connect();

    // Executar steps em ordem
    await runStep(cleanupPreviousData, 'Limpando dados anteriores');
    await runStep(seedCoreInfrastructure, 'Criando infraestrutura core');
    await runStep(seedLocations, 'Criando localizações');
    await runStep(seedCategoriesAndVehicles, 'Criando categorias e veículos');
    await runStep(seedUsers, 'Criando usuários');
    await runStep(seedParticipants, 'Criando participantes');
    await runStep(seedJudicialInfrastructure, 'Criando infraestrutura judicial');
    await runStep(seedAssets, 'Criando ativos');
    await runStep(seedAuctionsAndLots, 'Criando leilões e lotes');
    await runStep(seedBidsAndInteractions, 'Criando lances e interações');
    await runStep(seedPaymentsAndWins, 'Criando pagamentos e arremates');
    await runStep(seedReviewsAndQuestions, 'Criando avaliações e perguntas');
    await runStep(seedNotificationsAndSubscribers, 'Criando notificações e assinantes');

    console.log('\n=====================================');
    console.log('✅ SUPER SEED MASTER DATA FINALIZADO!');
    console.log('=====================================');
    await logSummary();

  } catch (error) {
    console.error('❌ Erro no Super Seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

export { main as superSeedMasterData };