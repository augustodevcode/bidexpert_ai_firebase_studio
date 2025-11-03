/**
 * Script de seed completo para o sistema BidExpert
 * 
 * Este script popula todas as tabelas do banco de dados usando os serviços do sistema,
 * garantindo que as regras de negócio sejam respeitadas.
 */

import { faker } from '@faker-js/faker/locale/pt_BR';
import { v4 as uuidv4 } from 'uuid';
import { TenantService } from '../src/services/tenant.service';
import { UserService } from '../src/services/user.service';
import { AssetService } from '../src/services/asset.service';
import { AuctionService } from '../src/services/auction.service';
import { LotService } from '../src/services/lot.service';
import { BidService } from '../src/services/bid.service';
import { DocumentService } from '../src/services/document.service';
import { NotificationService } from '../src/services/notification.service';
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserHabilitationStatus } from '@prisma/client';

// Configuração do Faker
faker.seed(123);

// Tipos auxiliares
type UserRole = 'ADMIN' | 'AUCTIONEER' | 'BIDDER' | 'CONSIGNOR';

// Dados de exemplo
const TENANTS = [
  { name: 'BidExpert', subdomain: 'bidexpert' },
  { name: 'Leilão Brasil', subdomain: 'leilaobrasil' },
  { name: 'Super Leilões', subdomain: 'superleiloes' },
  { name: 'Leilão Nacional', subdomain: 'leilaonacional' },
  { name: 'Leilão Premium', subdomain: 'leilaopremium' },
];

const USER_ROLES: UserRole[] = ['ADMIN', 'AUCTIONEER', 'BIDDER', 'CONSIGNOR'];

const VEHICLE_MAKES = [
  'Fiat', 'Volkswagen', 'Chevrolet', 'Hyundai', 'Toyota',
  'Jeep', 'Renault', 'Honda', 'Nissan', 'Ford'
];

const VEHICLE_MODELS = [
  'Uno', 'Gol', 'Onix', 'HB20', 'Corolla',
  'Compass', 'Kwid', 'Civic', 'Kicks', 'Ranger'
];

const PROPERTY_TYPES = [
  'Casa', 'Apartamento', 'Sobrado', 'Cobertura', 'Terreno',
  'Sala Comercial', 'Galpão', 'Fazenda', 'Sítio', 'Chácara'
];

const CITIES = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Porto Alegre', 'Curitiba',
  'Brasília', 'Salvador', 'Fortaleza', 'Recife', 'Manaus'
];

// Serviços
const tenantService = new TenantService();
const userService = new UserService();
const assetService = new AssetService();
const auctionService = new AuctionService();
const lotService = new LotService();
const bidService = new BidService();
const documentService = new DocumentService();
const notificationService = new NotificationService();

/**
 * Função auxiliar para obter um elemento aleatório de um array
 */
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Função para criar tenants
 */
async function createTenants() {
  console.log('🏢 Criando tenants...');
  const createdTenants = [];
  
  for (const tenantData of TENANTS) {
    try {
      const result = await tenantService.createTenant(tenantData);
      if (result.success && result.tenant) {
        console.log(`✅ Tenant criado: ${result.tenant.name}`);
        createdTenants.push(result.tenant);
      } else {
        console.error(`❌ Falha ao criar tenant ${tenantData.name}: ${result.message}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao criar tenant ${tenantData.name}:`, error);
    }
  }
  
  return createdTenants;
}

/**
 * Função para criar usuários
 */
async function createUsers(tenants: any[], roles: {
  adminRoleId: bigint;
  auctioneerRoleId: bigint;
  bidderRoleId: bigint;
  consignorRoleId: bigint;
}) {
  console.log('👥 Criando usuários...');
  const createdUsers = [];
  
  // Mapear roles para seus IDs
  const roleMap: Record<string, bigint> = {
    'ADMIN': roles.adminRoleId,
    'AUCTIONEER': roles.auctioneerRoleId,
    'BIDDER': roles.bidderRoleId,
    'CONSIGNOR': roles.consignorRoleId
  };
  
  // Criar 5 usuários de cada tipo por tenant
  for (const tenant of tenants) {
    // 1 Admin
    try {
      const adminEmail = `admin_${tenant.subdomain}@example.com`;
      const user = await prisma.user.create({
        data: {
          email: adminEmail,
          password: await bcrypt.hash('senha123', 10),
          fullName: `Admin ${tenant.name}`,
          cpf: faker.string.numeric(11),
          cellPhone: faker.phone.number('(##) 9####-####'),
          tenantId: tenant.id,
          habilitationStatus: 'APPROVED',
          roles: {
            connect: { id: roles.adminRoleId }
          }
        },
        include: {
          roles: true
        }
      });
      
      console.log(`✅ Admin criado: ${adminEmail}`);
      createdUsers.push(user);
    } catch (error) {
      console.error('❌ Erro ao criar admin:', error);
    }
    
    // 2 Auctioneers
    for (let i = 0; i < 2; i++) {
      try {
        const auctioneerEmail = `auctioneer_${i}_${tenant.subdomain}@example.com`;
        const auctioneerResult = await userService.createUser({
          email: auctioneerEmail,
          password: 'senha123',
          fullName: `Leiloeiro ${i + 1} ${tenant.name}`,
          cpf: faker.string.numeric(11),
          cellPhone: faker.phone.number('(##) 9####-####'),
          roleIds: [roles.auctioneerRoleId],
          tenantId: tenant.id,
          habilitationStatus: 'APPROVED' as UserHabilitationStatus
        });
        
        if (auctioneerResult.success && auctioneerResult.user) {
          console.log(`✅ Leiloeiro criado: ${auctioneerEmail}`);
          createdUsers.push(auctioneerResult.user);
        }
      } catch (error) {
        console.error('❌ Erro ao criar leiloeiro:', error);
      }
    }
    
    // 5 Bidders
    for (let i = 0; i < 5; i++) {
      try {
        const bidderEmail = `bidder_${i}_${tenant.subdomain}@example.com`;
        const bidderResult = await userService.createUser({
          email: bidderEmail,
          password: 'senha123',
          fullName: `Arrematante ${i + 1} ${tenant.name}`,
          cpf: faker.string.numeric(11),
          cellPhone: faker.phone.number('(##) 9####-####'),
          roleIds: [roles.bidderRoleId],
          tenantId: tenant.id,
          habilitationStatus: 'APPROVED' as UserHabilitationStatus
        });
        
        if (bidderResult.success && bidderResult.user) {
          console.log(`✅ Arrematante criado: ${bidderEmail}`);
          createdUsers.push(bidderResult.user);
        }
      } catch (error) {
        console.error('❌ Erro ao criar arrematante:', error);
      }
    }
    
    // 2 Consignors
    for (let i = 0; i < 2; i++) {
      try {
        const consignorEmail = `consignor_${i}_${tenant.subdomain}@example.com`;
        const consignorResult = await userService.createUser({
          email: consignorEmail,
          password: 'senha123',
          fullName: `Consignante ${i + 1} ${tenant.name}`,
          cpf: faker.string.numeric(11),
          cellPhone: faker.phone.number('(##) 9####-####'),
          roleIds: [roles.consignorRoleId],
          tenantId: tenant.id,
          habilitationStatus: 'APPROVED' as UserHabilitationStatus
        });
        
        if (consignorResult.success && consignorResult.user) {
          console.log(`✅ Consignante criado: ${consignorEmail}`);
          createdUsers.push(consignorResult.user);
        }
      } catch (error) {
        console.error('❌ Erro ao criar consignante:', error);
      }
    }
  }
  
  return createdUsers;
}

/**
 * Função para criar ativos (veículos e imóveis)
 */
async function createAssets(tenants: any[]) {
  console.log('🚗 Criando ativos...');
  const createdAssets = [];
  
  // Criar veículos
  for (let i = 0; i < 10; i++) {
    const tenant = getRandomElement(tenants);
    const make = getRandomElement(VEHICLE_MAKES);
    const model = getRandomElement(VEHICLE_MODELS);
    const year = faker.number.int({ min: 2010, max: 2023 });
    
    try {
      const assetData = {
        title: `${make} ${model} ${year}`,
        description: `Veículo em ótimo estado, único dono, revisões em dia. ${faker.lorem.paragraph()}`,
        type: 'VEHICLE',
        status: 'DISPONIVEL',
        tenantId: tenant.id,
        make,
        model,
        year,
        color: faker.vehicle.color(),
        mileage: faker.number.int({ min: 1000, max: 100000 }),
        plate: `${faker.string.alpha(3).toUpperCase()}${faker.number.int({ min: 1000, max: 9999 })}`,
        fuelType: getRandomElement(['GASOLINA', 'ETANOL', 'FLEX', 'DIESEL', 'ELETRICO']),
        transmissionType: getRandomElement(['MANUAL', 'AUTOMATICO', 'AUTOMATIZADO', 'CVT']),
      };
      
      const createdAsset = await prisma.asset.create({
        data: {
          ...assetData,
          status: 'DISPONIVEL',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      if (createdAsset) {
        console.log(`✅ Veículo criado: ${createdAsset.title}`);
        createdAssets.push(createdAsset);
      }
    } catch (error) {
      console.error('❌ Erro ao criar veículo:', error);
    }
  }
  
  // Criar imóveis
  for (let i = 0; i < 10; i++) {
    const tenant = getRandomElement(tenants);
    const type = getRandomElement(PROPERTY_TYPES);
    const city = getRandomElement(CITIES);
    
    try {
      const assetData = {
        title: `${type} em ${city}`,
        description: `${type} em ótima localização. ${faker.lorem.paragraph()}`,
        type: 'PROPERTY',
        status: 'DISPONIVEL',
        tenantId: tenant.id,
        propertyType: type,
        address: `${faker.location.streetAddress()}, ${city}`,
        city,
        state: getRandomElement(['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'DF']),
        zipCode: faker.location.zipCode('#####-###'),
        bedrooms: faker.number.int({ min: 1, max: 5 }),
        bathrooms: faker.number.int({ min: 1, max: 4 }),
        area: faker.number.int({ min: 50, max: 500 }),
      };
      
      const result = await assetService.createAsset(assetData);
      if (result && result.success && result.assetId) {
        const createdAsset = await prisma.asset.findUnique({ where: { id: result.assetId } });
        if (createdAsset) {
          console.log(`✅ Imóvel criado: ${createdAsset.title}`);
          createdAssets.push(createdAsset);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao criar imóvel:', error);
    }
  }
  
  return createdAssets;
}

/**
 * Função para criar leilões
 */
async function createAuctions(tenants: any[], users: any[]) {
  console.log('🏛️ Criando leilões...');
  const createdAuctions = [];
  
  for (let i = 0; i < 5; i++) {
    const tenant = getRandomElement(tenants);
    const auctioneer = users.find(u => u.role === 'AUCTIONEER' && u.tenantId === tenant.id);
    
    if (!auctioneer) continue;
    
    try {
      const startDate = faker.date.soon({ days: 7 });
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      
      const auctionData = {
        title: `Leilão ${faker.commerce.department()} - ${faker.company.name()}`,
        description: `Leilão de ${faker.commerce.productName()}. ${faker.lorem.paragraph()}`,
        startDate,
        endDate,
        status: 'SCHEDULED',
        tenantId: tenant.id,
        auctioneerId: auctioneer.id,
      };
      
      const createdAuction = await prisma.auction.create({
        data: {
          ...auctionData,
          status: 'SCHEDULED',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          auctioneer: true
        }
      });
      
      if (createdAuction) {
        console.log(`✅ Leilão criado: ${createdAuction.title}`);
        createdAuctions.push(createdAuction);
      }
    } catch (error) {
      console.error('❌ Erro ao criar leilão:', error);
    }
  }
  
  return createdAuctions;
}

/**
 * Função para criar lotes
 */
async function createLots(auctions: any[], assets: any[]) {
  console.log('📦 Criando lotes...');
  const createdLots = [];
  
  for (const auction of auctions) {
    const auctionAssets = assets.filter(a => a.tenantId === auction.tenantId);
    
    for (let i = 0; i < 10 && i < auctionAssets.length; i++) {
      const asset = auctionAssets[i];
      
      try {
        const lotData = {
          title: asset.title,
          description: asset.description,
          startingBid: faker.number.int({ min: 1000, max: 100000 }),
          minIncrement: faker.number.int({ min: 100, max: 1000 }),
          status: 'PENDING',
          auctionId: auction.id,
          assetId: asset.id,
          tenantId: auction.tenantId,
        };
        
        const createdLot = await prisma.lot.create({
          data: {
            ...lotData,
            status: 'PENDING',
            currentBid: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            auction: { connect: { id: lotData.auctionId } },
            asset: { connect: { id: lotData.assetId } },
            tenant: { connect: { id: lotData.tenantId } }
          },
          include: {
            auction: true,
            asset: true
          }
        });
        
        if (createdLot) {
          console.log(`✅ Lote criado: ${createdLot.title}`);
          createdLots.push(createdLot);
        }
      } catch (error) {
        console.error('❌ Erro ao criar lote:', error);
      }
    }
  }
  
  return createdLots;
}

/**
 * Função para criar lances
 */
async function createBids(lots: any[], users: any[]) {
  console.log('💵 Criando lances...');
  const createdBids = [];
  
  for (const lot of lots) {
    const bidders = users.filter(u => u.role === 'BIDDER' && u.tenantId === lot.tenantId);
    
    if (bidders.length === 0) continue;
    
    // Criar entre 1 e 5 lances por lote
    const numBids = faker.number.int({ min: 1, max: 5 });
    let currentBid = lot.startingBid;
    
    for (let i = 0; i < numBids; i++) {
      const bidder = getRandomElement(bidders);
      currentBid += faker.number.int({ min: lot.minIncrement, max: lot.minIncrement * 2 });
      
      try {
        const bidData = {
          amount: currentBid,
          lotId: lot.id,
          userId: bidder.id,
          tenantId: lot.tenantId,
        };
        
        const bid = await prisma.bid.create({
          data: {
            amount: currentBid,
            timestamp: new Date(),
            lot: { connect: { id: lot.id } },
            auction: { connect: { id: lot.auctionId } },
            bidder: { connect: { id: bidder.id } },
            tenant: { connect: { id: lot.tenantId } }
          }
        });
        
        if (bid) {
          console.log(`✅ Lance de R$ ${(currentBid / 100).toFixed(2)} criado para o lote ${lot.id}`);
          createdBids.push(bid);
          
          // Atualizar o preço atual do lote
          await prisma.lot.update({
            where: { id: lot.id },
            data: { 
              currentBid: currentBid,
              status: 'EM_LEILAO' // Atualizar status para refletir que há lances
            }
          });
        }
      } catch (error) {
        console.error('❌ Erro ao criar lance:', error);
      }
    }
  }
  
  return createdBids;
}

/**
 * Função para criar documentos
 */
async function createDocuments(assets: any[], users: any[]) {
  console.log('📄 Criando documentos...');
  const createdDocuments = [];
  
  for (const asset of assets) {
    const owner = users.find(u => u.tenantId === asset.tenantId);
    if (!owner) continue;
    
    try {
      const documentData = {
        title: `Documentação do ${asset.title}`,
        description: `Documentação completa do ${asset.title}`,
        type: 'ASSET',
        referenceId: asset.id,
        fileUrl: faker.internet.url(),
        status: 'APPROVED',
        uploadedById: owner.id,
        tenantId: asset.tenantId,
      };
      
      // Usar o Prisma diretamente para criar documentos, já que não há um serviço específico
      try {
        const document = await prisma.document.create({
          data: {
            ...documentData,
            type: 'ASSET_DOCUMENT',
            status: 'APPROVED',
            uploadedAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        if (document) {
          console.log(`✅ Documento criado: ${document.title}`);
          createdDocuments.push(document);
        }
      } catch (error) {
        console.error('❌ Erro ao criar documento:', error);
      }
    } catch (error) {
      console.error('❌ Erro ao criar documento:', error);
    }
  }
  
  return createdDocuments;
}

/**
 * Função para criar notificações
 */
async function createNotifications(users: any[]) {
  console.log('🔔 Criando notificações...');
  const createdNotifications = [];
  
  for (const user of users) {
    // Criar entre 1 e 3 notificações por usuário
    const numNotifications = faker.number.int({ min: 1, max: 3 });
    
    for (let i = 0; i < numNotifications; i++) {
      try {
        const notificationData = {
          title: faker.lorem.words(3),
          message: faker.lorem.sentence(),
          type: getRandomElement(['INFO', 'WARNING', 'SUCCESS', 'ERROR']),
          userId: user.id,
          tenantId: user.tenantId,
          read: faker.datatype.boolean(),
        };
        
        // Usar o Prisma diretamente para criar notificações
        try {
          const notification = await prisma.notification.create({
            data: {
              ...notificationData,
              read: false,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          if (notification) {
            console.log(`✅ Notificação criada para o usuário ${user.id}`);
            createdNotifications.push(notification);
          }
        } catch (error) {
          console.error('❌ Erro ao criar notificação:', error);
        }
      } catch (error) {
        console.error('❌ Erro ao criar notificação:', error);
      }
    }
  }
  
  return createdNotifications;
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando seed de dados...');
  
  try {
    // 1. Criar tenants
    const tenants = await createTenants();
    if (tenants.length === 0) {
      throw new Error('Nenhum tenant foi criado. Abortando seed.');
    }
    
    // 2. Obter ou criar roles
    console.log('👥 Obtendo roles...');
    const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
    const auctioneerRole = await prisma.role.findFirst({ where: { name: 'AUCTIONEER' } });
    const bidderRole = await prisma.role.findFirst({ where: { name: 'BIDDER' } });
    const consignorRole = await prisma.role.findFirst({ where: { name: 'CONSIGNOR' } });
    
    if (!adminRole || !auctioneerRole || !bidderRole || !consignorRole) {
      throw new Error('Roles não encontradas. Certifique-se de que o banco de dados foi semeado corretamente.');
    }
    
    // 3. Criar usuários
    const users = await createUsers(tenants, {
      adminRoleId: adminRole.id,
      auctioneerRoleId: auctioneerRole.id,
      bidderRoleId: bidderRole.id,
      consignorRoleId: consignorRole.id
    });
    
    if (users.length === 0) {
      throw new Error('Nenhum usuário foi criado. Abortando seed.');
    }
    
    // 3. Criar ativos (veículos e imóveis)
    const assets = await createAssets(tenants);
    if (assets.length === 0) {
      console.warn('⚠️ Nenhum ativo foi criado.');
    }
    
    // 4. Criar leilões
    const auctions = await createAuctions(tenants, users);
    if (auctions.length === 0) {
      console.warn('⚠️ Nenhum leilão foi criado.');
    }
    
    // 5. Criar lotes
    const lots = await createLots(auctions, assets);
    if (lots.length === 0) {
      console.warn('⚠️ Nenhum lote foi criado.');
    }
    
    // 6. Criar lances
    const bids = await createBids(lots, users);
    if (bids.length === 0) {
      console.warn('⚠️ Nenhum lance foi criado.');
    }
    
    // 7. Criar documentos
    const documents = await createDocuments(assets, users);
    if (documents.length === 0) {
      console.warn('⚠️ Nenhum documento foi criado.');
    }
    
    // 8. Criar notificações
    const notifications = await createNotifications(users);
    if (notifications.length === 0) {
      console.warn('⚠️ Nenhuma notificação foi criada.');
    }
    
    console.log('✨ Seed concluído com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`- Tenants: ${tenants.length}`);
    console.log(`- Usuários: ${users.length}`);
    console.log(`- Ativos: ${assets.length}`);
    console.log(`- Leilões: ${auctions.length}`);
    console.log(`- Lotes: ${lots.length}`);
    console.log(`- Lances: ${bids.length}`);
    console.log(`- Documentos: ${documents.length}`);
    console.log(`- Notificações: ${notifications.length}`);
    
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a função principal
main()
  .catch((error) => {
    console.error('❌ Erro não tratado:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
