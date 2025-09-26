
// scripts/seed-from-scenarios.ts
/**
 * @fileoverview Script abrangente para popular o banco de dados simulando
 * cenários de usuário realistas, utilizando os serviços da aplicação para
 * garantir a integridade e a aplicação das regras de negócio.
 */

import { PrismaClient, AssetStatus, AuctionStatus, AuctionType, AuctionMethod } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { UserService } from '../src/services/user.service';
import { AuctionService } from '../src/services/auction.service';
import { SellerService } from '../src/services/seller.service';
import { AuctioneerService } from '../src/services/auctioneer.service';
import { CategoryService } from '../src/services/category.service';
import { AssetService } from '../src/services/asset.service';
import { LotService } from '../src/services/lot.service';
import { AssetFormData } from '@/types';

const prisma = new PrismaClient();
const userService = new UserService();
const auctionService = new AuctionService();
const sellerService = new SellerService();
const auctioneerService = new AuctioneerService();
const categoryService = new CategoryService();
const assetService = new AssetService();
const lotService = new LotService();

// --- Armazenamento de IDs Gerados ---
let tenantId: string;
const userIds: string[] = [];
const sellerIds: string[] = [];
const auctioneerIds: string[] = [];
const categoryIds: { id: string; name: string }[] = [];
const assetIds: string[] = [];
const auctionIds: string[] = [];

// --- Funções Auxiliares de Geração de Dados ---

const getRandomId = (ids: string[]) => ids[Math.floor(Math.random() * ids.length)];

function createVehicleAssetData(sellerId: string, categoryId: string): AssetFormData {
    return {
        title: `Veículo ${faker.vehicle.manufacturer()} ${faker.vehicle.model()} ${faker.number.int({ min: 2010, max: 2024 })}`,
        description: faker.lorem.paragraph(),
        status: AssetStatus.DISPONIVEL,
        evaluationValue: faker.number.float({ min: 15000, max: 150000, multipleOf: 100 }),
        sellerId,
        categoryId,
        // Vehicle Specific Fields
        plate: `${faker.string.alpha(3).toUpperCase()}-${faker.string.numeric(4)}`,
        make: faker.vehicle.manufacturer(),
        model: faker.vehicle.model(),
        year: faker.number.int({ min: 2010, max: 2024 }),
        mileage: faker.number.int({ min: 1000, max: 200000 }),
        color: faker.vehicle.color(),
        fuelType: faker.vehicle.fuel(),
        transmissionType: faker.helpers.arrayElement(['Automática', 'Manual']),
        vin: faker.vehicle.vin(),
        renavam: faker.string.numeric(11),
    };
}

function createRealEstateAssetData(sellerId: string, categoryId: string): AssetFormData {
    return {
        title: `Imóvel Residencial ${faker.location.streetAddress()}`,
        description: faker.lorem.paragraph(),
        status: AssetStatus.DISPONIVEL,
        evaluationValue: faker.number.float({ min: 200000, max: 2000000, multipleOf: 1000 }),
        sellerId,
        categoryId,
        // Real Estate Specific Fields
        propertyRegistrationNumber: faker.string.numeric(15),
        iptuNumber: faker.string.numeric(12),
        isOccupied: faker.datatype.boolean(),
        totalArea: faker.number.float({ min: 100, max: 5000, multipleOf: 10 }),
        builtArea: faker.number.float({ min: 50, max: 1000, multipleOf: 5 }),
        bedrooms: faker.number.int({ min: 1, max: 7 }),
        suites: faker.number.int({ min: 0, max: 5 }),
        bathrooms: faker.number.int({ min: 1, max: 8 }),
        parkingSpaces: faker.number.int({ min: 0, max: 6 }),
    };
}

function createGenericAssetData(sellerId: string, categoryId: string): AssetFormData {
    return {
        title: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        status: AssetStatus.DISPONIVEL,
        evaluationValue: faker.number.float({ min: 50, max: 5000, multipleOf: 10 }),
        sellerId,
        categoryId,
        brand: faker.company.name(),
        itemCondition: faker.helpers.arrayElement(['Novo', 'Usado', 'Com defeito']),
    };
}

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
      categoryIds.push({ id: result.categoryId, name });
    } else {
      const existing = await prisma.lotCategory.findFirst({ where: { name } });
      if (existing) categoryIds.push({ id: existing.id, name });
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
  const totalAssets = 200;
  console.log(`Criando ${totalAssets} bens...`);

  if (sellerIds.length === 0 || categoryIds.length === 0) {
    console.error('❌ Vendedores ou Categorias não foram criados. Abortando seed de Assets.');
    return;
  }

  for (let i = 0; i < totalAssets; i++) {
    const randomCategory = faker.helpers.arrayElement(categoryIds);
    const randomSeller = getRandomId(sellerIds);
    let assetData: AssetFormData;

    switch (randomCategory.name) {
        case 'Veículos':
            assetData = createVehicleAssetData(randomSeller, randomCategory.id);
            break;
        case 'Imóveis':
            assetData = createRealEstateAssetData(randomSeller, randomCategory.id);
            break;
        default:
            assetData = createGenericAssetData(randomSeller, randomCategory.id);
            break;
    }

    const result = await assetService.createAsset(tenantId, assetData);
    if (result.success && result.assetId) {
        assetIds.push(result.assetId);
    } else {
        console.error(`Falha ao criar bem ${i + 1}: ${result.message}`);
    }

    if ((i + 1) % 20 === 0) {
        console.log(` -> ${i + 1}/${totalAssets} bens criados...`);
    }
  }
  console.log(`✅ ${assetIds.length} bens criados com sucesso.`);
}

async function seedAuctionsAndLots() {
  console.log('--- Iniciando Seed de Leilões e Lotes ---');
  const totalAuctions = 40;
  const availableAssetIds = [...assetIds]; // Copia para não modificar o original
  console.log(`Criando ${totalAuctions} leilões e seus lotes...`);

  for (let i = 0; i < totalAuctions; i++) {
    let status: AuctionStatus;
    const percentage = (i / totalAuctions) * 100;
    if (percentage < 5) status = AuctionStatus.RASCUNHO; // 5%
    else if (percentage < 15) status = AuctionStatus.FINALIZADO; // 10%
    else status = AuctionStatus.ABERTO_PARA_LANCES; // 85%

    // FIX: Passar `stages` para o service, que por sua vez passará para o Prisma.
    const stagesData = {
        create: [
            {
                name: '1ª Praça',
                startDate: status === 'FINALIZADO' ? faker.date.past({ years: 1 }) : new Date(),
                endDate: status === 'FINALIZADO' ? faker.date.past({ years: 1 }) : faker.date.future(),
            }
        ]
    };

    const auctionData = {
        title: `Leilão de ${faker.commerce.department()} (${status}) #${i + 1}`,
        description: faker.lorem.sentence(),
        auctioneerId: getRandomId(auctioneerIds),
        sellerId: getRandomId(sellerIds),
        categoryId: getRandomId(categoryIds).id,
        status: status,
        auctionType: faker.helpers.arrayElement(Object.values(AuctionType)),
        auctionMethod: faker.helpers.arrayElement(Object.values(AuctionMethod)),
        stages: stagesData, // Correção aplicada aqui
    };

    // @ts-ignore - Ignorando o erro de tipo para passar `stages` diretamente
    const auctionResult = await auctionService.createAuction(tenantId, auctionData);

    if (auctionResult.success && auctionResult.auctionId) {
        auctionIds.push(auctionResult.auctionId);
        console.log(` -> Leilão "${auctionData.title}" criado.`);

        // Criar 5 lotes para este leilão
        for (let j = 0; j < 5; j++) {
            if (availableAssetIds.length === 0) {
                console.warn(' (!) Não há mais bens disponíveis para criar lotes.');
                break;
            }
            const assetIdForLot = availableAssetIds.splice(0, 1); // Pega e remove o primeiro bem disponível

            const lotData = {
                title: `Lote ${j + 1} - ${faker.commerce.productName()}`,
                description: faker.lorem.paragraph(),
                initialPrice: faker.number.float({ min: 100, max: 10000, multipleOf: 50 }),
                price: 0,
                status: status === 'ABERTO_PARA_LANCES' ? 'ABERTO_PARA_LANCES' : 'EM_BREVE',
                auctionId: auctionResult.auctionId,
                assetIds: assetIdForLot,
                type: auctionData.categoryId, // Garante que o tipo do lote seja o mesmo da categoria do leilão
            };

            await lotService.createLot(lotData, tenantId);
        }
         console.log(`    -> 5 lotes criados para o leilão #${i + 1}.`);
    } else {
        console.error(`Falha ao criar leilão ${i + 1}: ${auctionResult.message}`);
    }
  }
  console.log(`✅ ${auctionIds.length} leilões criados com sucesso.`);
}

async function simulateBiddingAndWins() {
  console.log('--- Iniciando Simulação de Lances e Arremates ---');
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
