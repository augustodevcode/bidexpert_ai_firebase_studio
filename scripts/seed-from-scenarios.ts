
// scripts/seed-from-scenarios.ts
/**
 * @fileoverview Script abrangente para popular o banco de dados simulando
 * cenários de usuário realistas, utilizando os serviços da aplicação para
 * garantir a integridade e a aplicação das regras de negócio.
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { UserService } from '../src/services/user.service';
import { AuctionService } from '../src/services/auction.service';
import { SellerService } from '../src/services/seller.service';
import { AuctioneerService } from '../src/services/auctioneer.service';
import { CategoryService } from '../src/services/category.service';
// Outros serviços serão importados aqui conforme necessário (LotService, BidService, etc.)

const prisma = new PrismaClient();
const userService = new UserService();
const auctionService = new AuctionService();
const sellerService = new SellerService();
const auctioneerService = new AuctioneerService();
const categoryService = new CategoryService();


// --- Armazenamento de IDs Gerados ---
let tenantId: string;
const userIds: string[] = [];
const sellerIds: string[] = [];
const auctioneerIds: string[] = [];
const categoryIds: string[] = [];


// --- Funções de Geração de Dados ---

async function seedUsers() {
  console.log('--- Iniciando Seed de Usuários ---');
  console.log(`Criando 500 usuários para o tenant ${tenantId}...`);

  for (let i = 0; i < 500; i++) {
    const fullName = faker.person.fullName();
    const email = faker.internet.email({ firstName: fullName.split(' ')[0], lastName: `user${i}` });
    
    const result = await userService.createUser({
      fullName,
      email,
      password: 'password123',
      tenantId: tenantId,
    });

    if (result.success && result.userId) {
      userIds.push(result.userId);
      if (i % 50 === 0) {
        console.log(` -> ${i + 1}/500 usuários criados...`);
      }
    } else {
      console.error(`Falha ao criar usuário ${i + 1}: ${result.message}`);
    }
  }
  console.log(`✅ ${userIds.length} usuários criados com sucesso.`);
}

async function seedCoreEntities() {
  console.log('--- Iniciando Seed de Entidades Core (Leiloeiros, Vendedores, Categorias) ---');
  
  // 1. Categorias
  const categoryNames = ['Veículos', 'Imóveis', 'Eletrônicos', 'Máquinas e Equipamentos', 'Diversos'];
  console.log(`Criando ${categoryNames.length} categorias...`);
  for (const name of categoryNames) {
    const result = await categoryService.createCategory({ name, description: `Categoria de ${name}` });
    if (result.success && result.categoryId) {
      categoryIds.push(result.categoryId);
    } else {
      // Tenta buscar a categoria se a criação falhou por duplicidade
      const existing = await prisma.lotCategory.findFirst({ where: { name } });
      if (existing) categoryIds.push(existing.id);
      else console.error(`Falha ao criar/buscar categoria "${name}": ${result.message}`);
    }
  }
  console.log(`✅ ${categoryIds.length} categorias criadas/carregadas.`);

  // 2. Leiloeiros
  console.log('Criando 10 leiloeiros...');
  for (let i = 0; i < 10; i++) {
    const name = `Leiloeiro Oficial ${faker.person.lastName()} ${i + 1}`;
    const result = await auctioneerService.createAuctioneer(tenantId, {
      name,
      email: faker.internet.email({ firstName: 'contato', lastName: name.replace(/\s/g, '') }),
      contactName: faker.person.fullName(),
      phone: faker.phone.number(),
      registrationNumber: faker.string.numeric(10),
    });
    if (result.success && result.auctioneerId) {
      auctioneerIds.push(result.auctioneerId);
    } else {
      console.error(`Falha ao criar leiloeiro ${i + 1}: ${result.message}`);
    }
  }
  console.log(`✅ ${auctioneerIds.length} leiloeiros criados.`);

  // 3. Vendedores (Comitentes)
  console.log('Criando 20 vendedores...');
  for (let i = 0; i < 20; i++) {
    const name = `${faker.company.name()} ${i % 4 === 0 ? 'Vara Cível' : ''}`;
    const result = await sellerService.createSeller(tenantId, {
      name,
      email: faker.internet.email({ firstName: 'vendas', lastName: name.replace(/\s/g, '') }),
      contactName: faker.person.fullName(),
      phone: faker.phone.number(),
      isJudicial: name.includes('Vara'),
    });
    if (result.success && result.sellerId) {
      sellerIds.push(result.sellerId);
    } else {
      console.error(`Falha ao criar vendedor ${i + 1}: ${result.message}`);
    }
  }
  console.log(`✅ ${sellerIds.length} vendedores criados.`);
}

async function seedAssets() {
  console.log('--- Iniciando Seed de Bens (Assets) ---');
  // TODO: Implementar a criação de bens de múltiplas categorias com dados complexos.
  console.log('Bens a serem implementados.');
}

async function seedAuctionsAndLots() {
  console.log('--- Iniciando Seed de Leilões e Lotes ---');
  // TODO: Implementar a criação de leilões com base nos status e tipos solicitados.
  // TODO: Vincular 5 lotes a cada leilão.
  console.log('Leilões e Lotes a serem implementados.');
}

async function simulateBiddingAndWins() {
  console.log('--- Iniciando Simulação de Lances e Arremates ---\');
  // TODO: Simular usuários dando lances nos lotes.
  // TODO: Definir vencedores para alguns lotes.
  // TODO: Simular pagamentos (e a falta deles).
  console.log('Simulação de Lances a ser implementada.');
}

async function runDataVerification() {
    console.log('--- Iniciando Verificação dos Dados ---');
    // TODO: Implementar queries com COUNT, GROUP BY, e verificação de órfãos.
    console.log('Verificação a ser implementada.');
}


// --- Orquestrador Principal ---

async function main() {
  console.log('🚀 Iniciando processo de seed completo...');
  
  const defaultTenant = await prisma.tenant.findFirst();
  if (!defaultTenant) {
    throw new Error('Nenhum tenant encontrado. Execute o seed básico primeiro ou crie um tenant manualmente.');
  }
  tenantId = defaultTenant.id;
  console.log(`Tenant padrão selecionado: ${defaultTenant.name} (ID: ${tenantId})`);

  // A ordem de execução é crucial para manter a integridade relacional.
  await seedCoreEntities();
  await seedUsers();
  await seedAssets();
  await seedAuctionsAndLots();
  await simulateBiddingAndWins();
  await runDataVerification();

  console.log('✅ Processo de seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Ocorreu um erro durante o processo de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
