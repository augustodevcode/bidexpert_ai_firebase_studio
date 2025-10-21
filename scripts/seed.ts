/**
 * @fileoverview Script de seed simplificado para a plataforma BidExpert.
 * Popula o banco de dados com o mínimo de dados necessários para um ambiente de desenvolvimento funcional.
 *
 * Para executar: `npx tsx scripts/seed.ts`
 */
import { PrismaClient } from '@prisma/client';
import {
  TenantService,
  RoleService,
  UserService,
  CategoryService,
  StateService,
  CityService,
  AuctioneerService,
  SellerService,
  AssetService,
  AuctionService,
  LotService,
} from './services'; // Assuming services are correctly exported from './services'

const prisma = new PrismaClient();

// --- Instâncias dos Serviços ---
const tenantService = new TenantService();
const roleService = new RoleService();
const userService = new UserService();
const categoryService = new CategoryService();
const stateService = new StateService();
const cityService = new CityService();
const auctioneerService = new AuctioneerService();
const sellerService = new SellerService();
const assetService = new AssetService();
const auctionService = new AuctionService();
const lotService = new LotService();

// --- Lógica Principal de Seeding ---
async function main() {
  console.log('Iniciando o seed simplificado do banco de dados...');
  console.log('=================================================\n');

  try {
    await cleanupPreviousData();
    const coreInfra = await seedCoreInfra();
    const supportEntities = await seedSupportEntities(coreInfra.tenantId);
    await seedMainFlow(coreInfra.tenantId, supportEntities);

    console.log('\n=================================================');
    console.log('✅ Seed simplificado finalizado com sucesso!');
    console.log('=================================================');
  } catch (error) {
    console.error('\n❌ Ocorreu um erro durante o processo de seeding:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanupPreviousData() {
  console.log('Fase 1: Limpando dados antigos...');
  // A ordem é crucial para respeitar as constraints de chave estrangeira
  await prisma.assetsOnLots.deleteMany({});
  await prisma.lot.deleteMany({});
  await prisma.auction.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.seller.deleteMany({});
  await prisma.auctioneer.deleteMany({});
  await prisma.city.deleteMany({});
  await prisma.state.deleteMany({});
  await prisma.category.deleteMany({});
  // Não apagar User, Role, Tenant pois são mais fundamentais
  console.log(' -> Dados de teste limpos.');
}

async function seedCoreInfra() {
  console.log('\nFase 2: Infraestrutura Core (Tenant, Roles, Admin)...');

  // Criar Tenant
  const tenantResult = await tenantService.createTenant({
    name: 'BidExpert Dev',
    subdomain: 'dev',
    adminUser: {
      email: 'admin@dev.com',
      fullName: 'Admin Dev',
      password: 'admin123',
    },
  });
  if (!tenantResult.success || !tenantResult.tenant) {
    throw new Error(`Falha ao criar tenant: ${tenantResult.message}`);
  }
  const tenantId = tenantResult.tenant.id;
  console.log(` -> Tenant "BidExpert Dev" criado (ID: ${tenantId}).`);

  // Criar Roles
  const adminRole = await roleService.findOrCreateRole({ name: 'ADMIN', nameNormalized: 'ADMIN', description: 'Administrador' });
  await roleService.findOrCreateRole({ name: 'USER', nameNormalized: 'USER', description: 'Usuário Padrão' });
  console.log(' -> Roles "ADMIN" e "USER" garantidas.');

  // Criar Usuário Admin
  let admin = await userService.findUserByEmail('admin@dev.com');
  if (!admin) {
      const adminResult = await userService.createUser({
      email: 'admin@dev.com',
      password: 'admin123',
      fullName: 'Admin Dev',
      habilitationStatus: 'HABILITADO',
      accountType: 'PHYSICAL',
      roleIds: [adminRole.id],
      tenantIds: [tenantId],
    });
    if(!adminResult.success || !adminResult.userId) throw new Error("Falha ao criar usuário admin");
    admin = await userService.getUserById(adminResult.userId);
  }
  console.log(` -> Usuário Admin criado: ${admin?.email}`);

  return { tenantId };
}

async function seedSupportEntities(tenantId: bigint) {
    console.log('\nFase 3: Entidades de Suporte...');

    // Criar Categoria
    const catResult = await categoryService.createCategory({ name: 'Veículos', description: 'Carros, motos, caminhões' });
    if(!catResult.success || !catResult.categoryId) throw new Error("Falha ao criar categoria.");
    const categoryId = catResult.categoryId;
    console.log(' -> Categoria "Veículos" criada.');

    // Criar Localização
    const stateResult = await stateService.createState({ name: 'São Paulo', uf: 'SP' });
    if(!stateResult.success || !stateResult.stateId) throw new Error("Falha ao criar estado.");
    const cityResult = await cityService.createCity({ name: 'São Paulo', stateId: stateResult.stateId });
    if(!cityResult.success || !cityResult.cityId) throw new Error("Falha ao criar cidade.");
    console.log(' -> Localização "São Paulo/SP" criada.');

    // Criar Leiloeiro
    const auctioneerResult = await auctioneerService.createAuctioneer(tenantId, { name: 'Leiloeiro Padrão', email: 'leiloeiro@dev.com' });
    if(!auctioneerResult.success || !auctioneerResult.auctioneerId) throw new Error("Falha ao criar leiloeiro.");
    const auctioneerId = auctioneerResult.auctioneerId;
    console.log(' -> Leiloeiro "Leiloeiro Padrão" criado.');

    // Criar Vendedor
    const sellerResult = await sellerService.createSeller(tenantId, { name: 'Vendedor Padrão', email: 'seller@dev.com', isJudicial: false, slug: 'vendedor-padrao' });
    if(!sellerResult.success || !sellerResult.seller) throw new Error("Falha ao criar vendedor.");
    const sellerId = sellerResult.seller.id.toString();
    console.log(' -> Vendedor "Vendedor Padrão" criado.');
    
    return { categoryId, cityId: cityResult.cityId, stateId: stateResult.stateId, auctioneerId, sellerId };
}

async function seedMainFlow(tenantId: bigint, supportIds: { categoryId: string, cityId: string, stateId: string, auctioneerId: string, sellerId: string }) {
  console.log('\nFase 4: Fluxo Principal (Ativo, Leilão, Lote)...');
  const { categoryId, cityId, stateId, auctioneerId, sellerId } = supportIds;

  // Criar Ativo (Bem)
  const assetResult = await assetService.createAsset({
    title: 'Ford Ka 2018',
    description: 'Veículo em bom estado, com documentação em dia.',
    status: 'DISPONIVEL',
    categoryId: categoryId,
    sellerId: sellerId,
    evaluationValue: 35000,
    cityId: cityId,
    stateId: stateId,
    tenantId: tenantId,
  });
  if (!assetResult.success || !assetResult.asset) throw new Error(`Falha ao criar ativo: ${assetResult.message}`);
  const assetId = assetResult.asset.id;
  console.log(` -> Ativo "Ford Ka 2018" criado (ID: ${assetId}).`);

  // Criar Leilão
  const auctionDate = new Date();
  auctionDate.setDate(auctionDate.getDate() + 7); // Leilão em 7 dias
  const auctionResult = await auctionService.createAuction({
      title: 'Leilão de Veículos Usados',
      slug: 'leilao-veiculos-usados',
      description: 'Grande oportunidade de adquirir seu próximo veículo.',
      status: 'EM_BREVE',
      auctionType: 'EXTRAJUDICIAL',
      auctioneerId: auctioneerId,
      sellerId: sellerId,
      auctionDate: auctionDate,
      endDate: new Date(auctionDate.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 dias de duração
      tenantId: tenantId,
  });
  if (!auctionResult.success || !auctionResult.auction) throw new Error(`Falha ao criar leilão: ${auctionResult.message}`);
  const auctionId = auctionResult.auction.id;
  console.log(` -> Leilão "Leilão de Veículos Usados" criado (ID: ${auctionId}).`);

  // Criar Lote e associar o Ativo
  const lotResult = await lotService.createLot({
      title: 'Lote 001 - Ford Ka 2018',
      slug: 'lote-001-ford-ka-2018',
      description: 'Ford Ka 1.0 SE, Flex, 4 portas, Vermelho.',
      auctionId: auctionId,
      status: 'EM_BREVE',
      price: 25000,
      initialPrice: 25000,
      secondInitialPrice: 20000,
      tenantId: tenantId,
      assetIds: [assetId],
  });
  if(!lotResult.success) throw new Error(`Falha ao criar lote: ${lotResult.message}`);
  console.log(' -> Lote "Lote 001 - Ford Ka 2018" criado e associado ao leilão e ao ativo.');
}

main();
