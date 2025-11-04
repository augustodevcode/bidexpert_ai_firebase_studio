// scripts/seed-full-journey.ts
/**
 * @fileoverview Script de seed completo para a plataforma BidExpert
 * Cria um cenário completo de jornada de usuário, desde o cadastro até o pagamento
 * Utiliza exclusivamente os serviços da aplicação para garantir consistência
 */

// --- Importações ---
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Importação de serviços
import { RoleService } from '../src/services/role.service';
import { TenantService } from '../src/services/tenant.service';
import { UserService } from '../src/services/user.service';
import { AuctionService } from '../src/services/auction.service';
import { LotService } from '../src/services/lot.service';
import { AssetService } from '../src/services/asset.service';
import { BidService } from '../src/services/bid.service';
import { PaymentService } from '../src/services/payment.service';
import { SellerService } from '../src/services/seller.service';
import { AuctioneerService } from '../src/services/auctioneer.service';

// Tipos
import { UserRole } from '@prisma/client';

// Configuração
const prisma = new PrismaClient();

// Armazenamento de IDs para referência cruzada
const store: {
  tenantId?: string;
  adminUserId?: string;
  auctioneerId?: string;
  sellerId?: string;
  auctionId?: string;
  lotIds: string[];
  assetIds: string[];
  userIds: string[];
} = {
  lotIds: [],
  assetIds: [],
  userIds: []
};

// --- Funções Utilitárias ---
const log = (message: string, level: number = 0) => {
  const indent = '  '.repeat(level);
  console.log(`${indent}${message}`);
};

const runStep = async (fn: () => Promise<void>, name: string) => {
  try {
    log(`[INICIANDO] ${name}...`, 1);
    const start = Date.now();
    await fn();
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    log(`✅ [CONCLUÍDO] ${name} (${duration}s)`, 1);
  } catch (error) {
    log(`❌ [ERRO] em ${name}: ${error instanceof Error ? error.message : String(error)}`, 1);
    throw error;
  }
};

// --- Funções de Seed ---

/**
 * Cria um tenant (inquilino) para o cenário
 */
async function createTenant() {
  const tenantService = new TenantService();
  
  // Verifica se já existe um tenant
  const existingTenant = await prisma.tenant.findFirst();
  if (existingTenant) {
    store.tenantId = existingTenant.id;
    return;
  }
  
  // Cria um novo tenant
  const tenant = await tenantService.createTenant({
    name: 'Leilões Brasil',
    subdomain: 'leiloes-brasil',
    domain: 'leiloes-brasil.bidexpert.com.br',
    isActive: true,
    settings: {
      primaryColor: '#2563eb',
      logoUrl: 'https://via.placeholder.com/150x50?text=Leilões+Brasil'
    }
  });
  
  store.tenantId = tenant.id;
  log(`Tenant criado: ${tenant.name} (${tenant.id})`);
}

/**
 * Cria um usuário administrador
 */
async function createAdminUser() {
  const userService = new UserService();
  const roleService = new RoleService();
  
  // Verifica se já existe um admin
  const existingAdmin = await prisma.user.findFirst({
    where: { email: 'admin@bidexpert.com.br' }
  });
  
  if (existingAdmin) {
    store.adminUserId = existingAdmin.id;
    return;
  }
  
  // Cria o usuário admin
  const admin = await userService.createUser({
    email: 'admin@bidexpert.com.br',
    password: 'admin123',
    fullName: 'Administrador do Sistema',
    cpf: '00000000000',
    phone: '+5511999999999',
    roles: ['ADMIN']
  });
  
  store.adminUserId = admin.id;
  store.userIds.push(admin.id);
  log(`Usuário admin criado: ${admin.email}`);
}

/**
 * Cria um leiloeiro
 */
async function createAuctioneer() {
  const auctioneerService = new AuctioneerService();
  
  const auctioneer = await auctioneerService.createAuctioneer({
    name: 'Leiloeiro Oficial',
    description: 'Leiloeiro oficial do sistema',
    documentNumber: '12345678000199',
    email: 'leiloeiro@bidexpert.com.br',
    phone: '+5511988888888',
    address: 'Rua dos Leilões, 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01311000',
    commissionRate: 5.0
  });
  
  store.auctioneerId = auctioneer.id;
  log(`Leiloeiro criado: ${auctioneer.name}`);
}

/**
 * Cria um comitente
 */
async function createSeller() {
  const sellerService = new SellerService();
  
  const seller = await sellerService.createSeller({
    name: 'Comitente Exemplo',
    documentNumber: '12345678000100',
    email: 'comitente@exemplo.com',
    phone: '+5511977777777',
    address: 'Av. Paulista, 1000',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310100',
    contactPerson: 'João da Silva',
    contactPhone: '+5511966666666',
    contactEmail: 'joao@exemplo.com'
  });
  
  store.sellerId = seller.id;
  log(`Comitente criado: ${seller.name}`);
}

/**
 * Cria um leilão
 */
async function createAuction() {
  const auctionService = new AuctionService();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7); // 7 dias a partir de agora
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30); // 30 dias de duração
  
  const auction = await auctionService.createAuction({
    title: 'Leilão de Imóveis e Veículos',
    description: 'Excelentes oportunidades em imóveis e veículos',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    auctioneerId: store.auctioneerId!,
    sellerId: store.sellerId!,
    type: 'ONLINE',
    status: 'DRAFT',
    terms: 'Termos e condições do leilão...',
    incrementTable: [
      { minValue: 0, maxValue: 1000, increment: 50 },
      { minValue: 1001, maxValue: 5000, increment: 100 },
      { minValue: 5001, maxValue: 10000, increment: 200 },
      { minValue: 10001, maxValue: 50000, increment: 500 },
      { minValue: 50001, maxValue: 100000, increment: 1000 },
      { minValue: 100001, maxValue: 500000, increment: 5000 },
      { minValue: 500001, maxValue: 1000000, increment: 10000 },
      { minValue: 1000001, maxValue: 5000000, increment: 50000 },
      { minValue: 5000001, maxValue: 10000000, increment: 100000 },
      { minValue: 10000001, maxValue: 1000000000, increment: 1000000 }
    ]
  });
  
  store.auctionId = auction.id;
  log(`Leilão criado: ${auction.title} (ID: ${auction.id})`);
}

/**
 * Cria ativos (bens) para o leilão
 */
async function createAssets() {
  const assetService = new AssetService();
  
  // Imóvel 1
  const asset1 = await assetService.createAsset({
    title: 'Apartamento de Luxo',
    description: 'Apartamento de 3 quartos, 200m², cobertura com vista para o mar',
    category: 'REAL_ESTATE',
    status: 'AVAILABLE',
    estimatedValue: 1500000,
    details: {
      type: 'APARTMENT',
      area: 200,
      bedrooms: 3,
      bathrooms: 3,
      parkingSpaces: 2,
      address: 'Av. Atlântica, 1702',
      neighborhood: 'Copacabana',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: '22021001',
      features: ['Piscina', 'Academia', 'Salão de Festas', 'Portaria 24h']
    },
    sellerId: store.sellerId!
  });
  
  // Veículo 1
  const asset2 = await assetService.createAsset({
    title: 'Honda Civic 2020',
    description: 'Honda Civic EXL 2.0 16V Flexone 4p Automático',
    category: 'VEHICLES',
    status: 'AVAILABLE',
    estimatedValue: 120000,
    details: {
      type: 'CAR',
      brand: 'Honda',
      model: 'Civic',
      year: 2020,
      color: 'Prata',
      mileage: 35000,
      fuelType: 'FLEX',
      transmission: 'AUTOMATIC',
      engineSize: '2.0',
      features: ['Ar Condicionado', 'Direção Hidráulica', 'Vidros Elétricos', 'Trava Elétrica']
    },
    sellerId: store.sellerId!
  });
  
  // Imóvel 2
  const asset3 = await assetService.createAsset({
    title: 'Casa com Piscina',
    description: 'Casa de 4 quartos, 300m², terreno de 500m², piscina e churrasqueira',
    category: 'REAL_ESTATE',
    status: 'AVAILABLE',
    estimatedValue: 1800000,
    details: {
      type: 'HOUSE',
      area: 300,
      landArea: 500,
      bedrooms: 4,
      bathrooms: 4,
      parkingSpaces: 4,
      address: 'Rua das Flores, 123',
      neighborhood: 'Alphaville',
      city: 'Barueri',
      state: 'SP',
      zipCode: '06455000',
      features: ['Piscina', 'Churrasqueira', 'Quintal', 'Jardim', 'Área de Serviço']
    },
    sellerId: store.sellerId!
  });
  
  store.assetIds = [asset1.id, asset2.id, asset3.id];
  log(`${store.assetIds.length} ativos criados`);
}

/**
 * Cria lotes para o leilão
 */
async function createLots() {
  const lotService = new LotService();
  
  // Lote 1 - Apartamento
  const lot1 = await lotService.createLot({
    auctionId: store.auctionId!,
    title: 'Lote 1 - Apartamento de Luxo',
    description: 'Excelente apartamento em Copacabana',
    startingBid: 1400000,
    minIncrement: 10000,
    status: 'PENDING',
    assetIds: [store.assetIds[0]]
  });
  
  // Lote 2 - Veículo
  const lot2 = await lotService.createLot({
    auctionId: store.auctionId!,
    title: 'Lote 2 - Honda Civic 2020',
    description: 'Semi-novo, único dono, revisões em dia',
    startingBid: 110000,
    minIncrement: 5000,
    status: 'PENDING',
    assetIds: [store.assetIds[1]]
  });
  
  // Lote 3 - Casa
  const lot3 = await lotService.createLot({
    auctionId: store.auctionId!,
    title: 'Lote 3 - Casa com Piscina',
    description: 'Excelente casa em condomínio fechado',
    startingBid: 1700000,
    minIncrement: 20000,
    status: 'PENDING',
    assetIds: [store.assetIds[2]]
  });
  
  store.lotIds = [lot1.id, lot2.id, lot3.id];
  log(`${store.lotIds.length} lotes criados`);
}

/**
 * Cria usuários participantes do leilão
 */
async function createBidders() {
  const userService = new UserService();
  
  // Usuário 1
  const user1 = await userService.createUser({
    email: 'comprador1@exemplo.com',
    password: 'senha123',
    fullName: 'João Silva',
    cpf: '11111111111',
    phone: '+5511999999999',
    roles: ['BIDDER'],
    address: 'Rua das Flores, 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234000'
  });
  
  // Usuário 2
  const user2 = await userService.createUser({
    email: 'comprador2@exemplo.com',
    password: 'senha123',
    fullName: 'Maria Oliveira',
    cpf: '22222222222',
    phone: '+5511888888888',
    roles: ['BIDDER'],
    address: 'Av. Paulista, 1000',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310000'
  });
  
  store.userIds.push(user1.id, user2.id);
  log(`${store.userIds.length} usuários criados`);
}

/**
 * Simula lances nos lotes
 */
async function simulateBids() {
  const bidService = new BidService();
  
  // Lance no Lote 1 (Apartamento)
  await bidService.placeBid({
    lotId: store.lotIds[0],
    userId: store.userIds[0],
    amount: 1450000
  });
  
  await bidService.placeBid({
    lotId: store.lotIds[0],
    userId: store.userIds[1],
    amount: 1500000
  });
  
  // Lance no Lote 2 (Veículo)
  await bidService.placeBid({
    lotId: store.lotIds[1],
    userId: store.userIds[0],
    amount: 115000
  });
  
  log('Lances simulados com sucesso');
}

/**
 * Finaliza o leilão e processa os vencedores
 */
async function finalizeAuction() {
  const auctionService = new AuctionService();
  const paymentService = new PaymentService();
  
  // Atualiza o status do leilão para FINALIZADO
  await auctionService.updateAuction(store.auctionId!, {
    status: 'FINISHED'
  });
  
  // Processa os pagamentos dos lotes arrematados
  for (const lotId of store.lotIds) {
    const lot = await prisma.lot.findUnique({
      where: { id: lotId },
      include: { bids: { orderBy: { amount: 'desc' }, take: 1 } }
    });
    
    if (lot?.bids.length) {
      const winningBid = lot.bids[0];
      
      // Cria o pagamento
      await paymentService.createPayment({
        userId: winningBid.userId,
        lotId: lot.id,
        amount: winningBid.amount,
        status: 'PENDING',
        paymentMethod: 'BOLETO',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 dias para pagamento
      });
      
      log(`Pagamento criado para o lote ${lot.number} - Valor: R$ ${winningBid.amount.toFixed(2)}`);
    }
  }
  
  log('Leilão finalizado e pagamentos processados');
}

// --- Execução Principal ---
async function main() {
  try {
    console.log('🚀 Iniciando seed da jornada completa do leilão...');
    
    // 1. Configuração Inicial
    await runStep(createTenant, 'Criando tenant');
    await runStep(createAdminUser, 'Criando usuário administrador');
    
    // 2. Cadastro de Leiloeiro e Comitente
    await runStep(createAuctioneer, 'Criando leiloeiro');
    await runStep(createSeller, 'Criando comitente');
    
    // 3. Criação do Leilão
    await runStep(createAuction, 'Criando leilão');
    
    // 4. Cadastro de Bens
    await runStep(createAssets, 'Criando ativos');
    
    // 5. Criação de Lotes
    await runStep(createLots, 'Criando lotes');
    
    // 6. Cadastro de Participantes
    await runStep(createBidders, 'Criando usuários participantes');
    
    // 7. Simulação de Lances
    await runStep(simulateBids, 'Simulando lances');
    
    // 8. Finalização do Leilão
    await runStep(finalizeAuction, 'Finalizando leilão');
    
    console.log('\n✅ Jornada do leilão concluída com sucesso!');
    console.log('\n🔑 Credenciais de Acesso:');
    console.log('----------------------');
    console.log('Admin: admin@bidexpert.com.br / admin123');
    console.log('Comprador 1: comprador1@exemplo.com / senha123');
    console.log('Comprador 2: comprador2@exemplo.com / senha123');
    console.log('\n🔗 Acesse o sistema e faça login com as credenciais acima.');
    
  } catch (error) {
    console.error('❌ Erro durante a execução do seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executa o script
main();
