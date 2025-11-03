/**
 * Script de seed simplificado para o sistema BidExpert
 * 
 * Este script popula todas as tabelas do banco de dados de forma direta,
 * garantindo que todas as dependências sejam respeitadas.
 */

import { faker } from '@faker-js/faker/locale/pt_BR';
import { PrismaClient, Prisma, UserHabilitationStatus, AssetStatus, AuctionStatus, LotStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Configuração do Faker
faker.seed(123);

// Inicializa o Prisma
const prisma = new PrismaClient();

// Dados de exemplo
const TENANTS = [
  { name: 'BidExpert', subdomain: 'bidexpert' },
  { name: 'Leilão Brasil', subdomain: 'leilaobrasil' },
  { name: 'Super Leilões', subdomain: 'superleiloes' },
  { name: 'Leilão Nacional', subdomain: 'leilaonacional' },
  { name: 'Leilão Premium', subdomain: 'leilaopremium' },
];

const ROLES = [
  { name: 'ADMIN', description: 'Administrador do sistema' },
  { name: 'AUCTIONEER', description: 'Leiloeiro' },
  { name: 'BIDDER', description: 'Arrematante' },
  { name: 'CONSIGNOR', description: 'Consignante' },
];

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

// Função auxiliar para obter um elemento aleatório de um array
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Função para criar tenants
async function createTenants() {
  console.log('🏢 Criando tenants...');
  const createdTenants = [];
  
  for (const tenantData of TENANTS) {
    try {
      const tenant = await prisma.tenant.create({
        data: {
          name: tenantData.name,
          subdomain: tenantData.subdomain,
          publicId: faker.string.uuid(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Tenant criado: ${tenant.name}`);
      createdTenants.push(tenant);
    } catch (error) {
      console.error(`❌ Erro ao criar tenant ${tenantData.name}:`, error);
    }
  }
  
  return createdTenants;
}

// Função para criar roles
async function createRoles() {
  console.log('👥 Criando roles...');
  const createdRoles = [];
  
  for (const roleData of ROLES) {
    try {
      const role = await prisma.role.upsert({
        where: { name: roleData.name },
        update: {},
        create: {
          name: roleData.name,
          description: roleData.description,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Role criada: ${role.name}`);
      createdRoles.push(role);
    } catch (error) {
      console.error(`❌ Erro ao criar role ${roleData.name}:`, error);
    }
  }
  
  return createdRoles;
}

// Função para criar usuários
async function createUsers(tenants: any[], roles: any[]) {
  console.log('👤 Criando usuários...');
  const createdUsers = [];
  
  const adminRole = roles.find(r => r.name === 'ADMIN');
  const auctioneerRole = roles.find(r => r.name === 'AUCTIONEER');
  const bidderRole = roles.find(r => r.name === 'BIDDER');
  const consignorRole = roles.find(r => r.name === 'CONSIGNOR');
  
  if (!adminRole || !auctioneerRole || !bidderRole || !consignorRole) {
    throw new Error('Algumas roles necessárias não foram encontradas');
  }
  
  for (const tenant of tenants) {
    // 1 Admin por tenant
    try {
      const adminEmail = `admin_${tenant.subdomain}@example.com`;
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: await bcrypt.hash('senha123', 10),
          fullName: `Admin ${tenant.name}`,
          cpf: faker.string.numeric(11),
          cellPhone: faker.phone.number('(##) 9####-####'),
          tenantId: tenant.id,
          habilitationStatus: 'APPROVED' as UserHabilitationStatus,
          roles: {
            create: {
              roleId: adminRole.id
            }
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          roles: true
        }
      });
      
      console.log(`✅ Admin criado: ${admin.email}`);
      createdUsers.push(admin);
      
      // 2 Auctioneers por tenant
      for (let i = 0; i < 2; i++) {
        const auctioneerEmail = `auctioneer_${i}_${tenant.subdomain}@example.com`;
        const auctioneer = await prisma.user.create({
          data: {
            email: auctioneerEmail,
            password: await bcrypt.hash('senha123', 10),
            fullName: `Leiloeiro ${i + 1} ${tenant.name}`,
            cpf: faker.string.numeric(11),
            cellPhone: faker.phone.number('(##) 9####-####'),
            tenantId: tenant.id,
            habilitationStatus: 'APPROVED' as UserHabilitationStatus,
            roles: {
              create: {
                roleId: auctioneerRole.id
              }
            },
            createdAt: new Date(),
            updatedAt: new Date()
          },
          include: {
            roles: true
          }
        });
        
        console.log(`✅ Leiloeiro criado: ${auctioneer.email}`);
        createdUsers.push(auctioneer);
      }
      
      // 5 Bidders por tenant
      for (let i = 0; i < 5; i++) {
        const bidderEmail = `bidder_${i}_${tenant.subdomain}@example.com`;
        const bidder = await prisma.user.create({
          data: {
            email: bidderEmail,
            password: await bcrypt.hash('senha123', 10),
            fullName: `Arrematante ${i + 1} ${tenant.name}`,
            cpf: faker.string.numeric(11),
            cellPhone: faker.phone.number('(##) 9####-####'),
            tenantId: tenant.id,
            habilitationStatus: 'APPROVED' as UserHabilitationStatus,
            roles: {
              create: {
                roleId: bidderRole.id
              }
            },
            createdAt: new Date(),
            updatedAt: new Date()
          },
          include: {
            roles: true
          }
        });
        
        console.log(`✅ Arrematante criado: ${bidder.email}`);
        createdUsers.push(bidder);
      }
      
      // 2 Consignors por tenant
      for (let i = 0; i < 2; i++) {
        const consignorEmail = `consignor_${i}_${tenant.subdomain}@example.com`;
        const consignor = await prisma.user.create({
          data: {
            email: consignorEmail,
            password: await bcrypt.hash('senha123', 10),
            fullName: `Consignante ${i + 1} ${tenant.name}`,
            cpf: faker.string.numeric(11),
            cellPhone: faker.phone.number('(##) 9####-####'),
            tenantId: tenant.id,
            habilitationStatus: 'APPROVED' as UserHabilitationStatus,
            roles: {
              create: {
                roleId: consignorRole.id
              }
            },
            createdAt: new Date(),
            updatedAt: new Date()
          },
          include: {
            roles: true
          }
        });
        
        console.log(`✅ Consignante criado: ${consignor.email}`);
        createdUsers.push(consignor);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao criar usuários para o tenant ${tenant.name}:`, error);
    }
  }
  
  return createdUsers;
}

// Função para criar ativos (veículos e imóveis)
async function createAssets(tenants: any[], users: any[]) {
  console.log('🚗 Criando ativos...');
  const createdAssets = [];
  
  // Criar veículos
  for (let i = 0; i < 10; i++) {
    const tenant = getRandomElement(tenants);
    const owner = getRandomElement(users.filter(u => u.tenantId === tenant.id));
    const make = getRandomElement(VEHICLE_MAKES);
    const model = getRandomElement(VEHICLE_MODELS);
    const year = faker.number.int({ min: 2010, max: 2023 });
    
    try {
      const asset = await prisma.asset.create({
        data: {
          publicId: faker.string.uuid(),
          title: `${make} ${model} ${year}`,
          description: `Veículo em ótimo estado, único dono, revisões em dia. ${faker.lorem.paragraph()}`,
          type: 'VEHICLE',
          status: 'DISPONIVEL' as AssetStatus,
          tenant: { connect: { id: tenant.id } },
          owner: { connect: { id: owner.id } },
          make,
          model,
          year,
          color: faker.vehicle.color(),
          mileage: faker.number.int({ min: 1000, max: 100000 }),
          plate: `${faker.string.alpha(3).toUpperCase()}${faker.number.int({ min: 1000, max: 9999 })}`,
          fuelType: getRandomElement(['GASOLINA', 'ETANOL', 'FLEX', 'DIESEL', 'ELETRICO']),
          transmissionType: getRandomElement(['MANUAL', 'AUTOMATICO', 'AUTOMATIZADO', 'CVT']),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Veículo criado: ${asset.title}`);
      createdAssets.push(asset);
    } catch (error) {
      console.error('❌ Erro ao criar veículo:', error);
    }
  }
  
  // Criar imóveis
  for (let i = 0; i < 10; i++) {
    const tenant = getRandomElement(tenants);
    const owner = getRandomElement(users.filter(u => u.tenantId === tenant.id));
    const type = getRandomElement(PROPERTY_TYPES);
    const city = getRandomElement(CITIES);
    
    try {
      const asset = await prisma.asset.create({
        data: {
          publicId: faker.string.uuid(),
          title: `${type} em ${city}`,
          description: `${type} em ótima localização. ${faker.lorem.paragraph()}`,
          type: 'PROPERTY',
          status: 'DISPONIVEL' as AssetStatus,
          tenant: { connect: { id: tenant.id } },
          owner: { connect: { id: owner.id } },
          propertyType: type,
          address: `${faker.location.streetAddress()}, ${city}`,
          city,
          state: getRandomElement(['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'DF']),
          zipCode: faker.location.zipCode('#####-###'),
          bedrooms: faker.number.int({ min: 1, max: 5 }),
          bathrooms: faker.number.int({ min: 1, max: 4 }),
          area: faker.number.int({ min: 50, max: 500 }),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Imóvel criado: ${asset.title}`);
      createdAssets.push(asset);
    } catch (error) {
      console.error('❌ Erro ao criar imóvel:', error);
    }
  }
  
  return createdAssets;
}

// Função para criar leilões
async function createAuctions(tenants: any[], users: any[]) {
  console.log('🏛️ Criando leilões...');
  const createdAuctions = [];
  
  for (const tenant of tenants) {
    const auctioneers = users.filter(u => 
      u.tenantId === tenant.id && 
      u.roles.some((r: any) => r.role.name === 'AUCTIONEER')
    );
    
    if (auctioneers.length === 0) {
      console.warn(`⚠️ Nenhum leiloeiro encontrado para o tenant ${tenant.name}`);
      continue;
    }
    
    // Criar 2 leilões por tenant
    for (let i = 0; i < 2; i++) {
      const auctioneer = getRandomElement(auctioneers);
      const startDate = faker.date.soon({ days: 7 });
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      
      try {
        const auction = await prisma.auction.create({
          data: {
            title: `Leilão ${faker.commerce.department()} - ${faker.company.name()}`,
            description: `Leilão de ${faker.commerce.productName()}. ${faker.lorem.paragraph()}`,
            startDate,
            endDate,
            status: 'SCHEDULED' as AuctionStatus,
            tenant: { connect: { id: tenant.id } },
            auctioneer: { connect: { id: auctioneer.id } },
            createdAt: new Date(),
            updatedAt: new Date()
          },
          include: {
            auctioneer: true
          }
        });
        
        console.log(`✅ Leilão criado: ${auction.title}`);
        createdAuctions.push(auction);
      } catch (error) {
        console.error('❌ Erro ao criar leilão:', error);
      }
    }
  }
  
  return createdAuctions;
}

// Função para criar lotes
async function createLots(auctions: any[], assets: any[]) {
  console.log('📦 Criando lotes...');
  const createdLots = [];
  
  for (const auction of auctions) {
    // Pegar apenas ativos do mesmo tenant do leilão
    const tenantAssets = assets.filter(a => a.tenantId === auction.tenantId);
    
    // Criar 5 lotes por leilão
    const assetsForAuction = faker.helpers.arrayElements(tenantAssets, Math.min(5, tenantAssets.length));
    
    for (const asset of assetsForAuction) {
      try {
        const lot = await prisma.lot.create({
          data: {
            title: asset.title,
            description: asset.description,
            startingBid: faker.number.int({ min: 1000, max: 100000 }),
            minIncrement: faker.number.int({ min: 100, max: 1000 }),
            currentBid: 0,
            status: 'PENDING' as LotStatus,
            auction: { connect: { id: auction.id } },
            asset: { connect: { id: asset.id } },
            tenant: { connect: { id: auction.tenantId } },
            createdAt: new Date(),
            updatedAt: new Date()
          },
          include: {
            auction: true,
            asset: true
          }
        });
        
        console.log(`✅ Lote criado: ${lot.title}`);
        createdLots.push(lot);
      } catch (error) {
        console.error('❌ Erro ao criar lote:', error);
      }
    }
  }
  
  return createdLots;
}

// Função para criar lances
async function createBids(lots: any[], users: any[]) {
  console.log('💵 Criando lances...');
  const createdBids = [];
  
  for (const lot of lots) {
    // Pegar apenas usuários do mesmo tenant do lote que são arrematantes
    const bidders = users.filter(u => 
      u.tenantId === lot.tenantId && 
      u.roles.some((r: any) => r.role.name === 'BIDDER')
    );
    
    if (bidders.length === 0) {
      console.warn(`⚠️ Nenhum arrematante encontrado para o lote ${lot.id}`);
      continue;
    }
    
    // Criar entre 1 e 5 lances por lote
    const numBids = faker.number.int({ min: 1, max: 5 });
    let currentBid = lot.startingBid;
    
    for (let i = 0; i < numBids; i++) {
      const bidder = getRandomElement(bidders);
      currentBid += faker.number.int({ 
        min: lot.minIncrement, 
        max: lot.minIncrement * 2 
      });
      
      try {
        const bid = await prisma.bid.create({
          data: {
            amount: currentBid,
            timestamp: new Date(),
            lot: { connect: { id: lot.id } },
            auction: { connect: { id: lot.auctionId } },
            bidder: { connect: { id: bidder.id } },
            tenant: { connect: { id: lot.tenantId } },
            bidderDisplay: bidder.fullName
          }
        });
        
        console.log(`✅ Lance de R$ ${(currentBid / 100).toFixed(2)} criado para o lote ${lot.id}`);
        createdBids.push(bid);
        
        // Atualizar o preço atual do lote
        await prisma.lot.update({
          where: { id: lot.id },
          data: { 
            currentBid: currentBid,
            status: 'IN_PROGRESS' as LotStatus // Atualizar status para refletir que há lances
          }
        });
      } catch (error) {
        console.error('❌ Erro ao criar lance:', error);
      }
    }
  }
  
  return createdBids;
}

// Função para criar documentos
async function createDocuments(assets: any[], users: any[]) {
  console.log('📄 Criando documentos...');
  const createdDocuments = [];
  
  for (const asset of assets) {
    const owner = users.find(u => u.id === asset.ownerId);
    if (!owner) continue;
    
    // Criar 2-3 documentos por ativo
    const numDocs = faker.number.int({ min: 2, max: 3 });
    
    for (let i = 0; i < numDocs; i++) {
      try {
        const document = await prisma.document.create({
          data: {
            title: `Documento ${i + 1} - ${asset.title}`,
            description: `Documentação ${i + 1} do ${asset.title}`,
            type: 'ASSET_DOCUMENT',
            referenceId: asset.id,
            fileUrl: faker.internet.url(),
            status: 'APPROVED',
            uploadedBy: { connect: { id: owner.id } },
            tenant: { connect: { id: asset.tenantId } },
            uploadedAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Documento criado: ${document.title}`);
        createdDocuments.push(document);
      } catch (error) {
        console.error('❌ Erro ao criar documento:', error);
      }
    }
  }
  
  return createdDocuments;
}

// Função para criar notificações
async function createNotifications(users: any[]) {
  console.log('🔔 Criando notificações...');
  const createdNotifications = [];
  
  for (const user of users) {
    // Criar 1-3 notificações por usuário
    const numNotifications = faker.number.int({ min: 1, max: 3 });
    
    for (let i = 0; i < numNotifications; i++) {
      try {
        const notification = await prisma.notification.create({
          data: {
            title: faker.lorem.words(3),
            message: faker.lorem.sentence(),
            type: getRandomElement(['INFO', 'WARNING', 'SUCCESS', 'ERROR']),
            isRead: faker.datatype.boolean(),
            userId: user.id,
            tenantId: user.tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Notificação criada para o usuário ${user.id}`);
        createdNotifications.push(notification);
      } catch (error) {
        console.error('❌ Erro ao criar notificação:', error);
      }
    }
  }
  
  return createdNotifications;
}

// Função principal
async function main() {
  console.log('🚀 Iniciando seed de dados...');
  
  try {
    // 1. Criar tenants
    const tenants = await createTenants();
    if (tenants.length === 0) {
      throw new Error('Nenhum tenant foi criado. Abortando seed.');
    }
    
    // 2. Criar roles
    const roles = await createRoles();
    if (roles.length === 0) {
      throw new Error('Nenhuma role foi criada. Abortando seed.');
    }
    
    // 3. Criar usuários
    const users = await createUsers(tenants, roles);
    if (users.length === 0) {
      throw new Error('Nenhum usuário foi criado. Abortando seed.');
    }
    
    // 4. Criar ativos (veículos e imóveis)
    const assets = await createAssets(tenants, users);
    if (assets.length === 0) {
      console.warn('⚠️ Nenhum ativo foi criado.');
    }
    
    // 5. Criar leilões
    const auctions = await createAuctions(tenants, users);
    if (auctions.length === 0) {
      console.warn('⚠️ Nenhum leilão foi criado.');
    }
    
    // 6. Criar lotes
    const lots = await createLots(auctions, assets);
    if (lots.length === 0) {
      console.warn('⚠️ Nenhum lote foi criado.');
    }
    
    // 7. Criar lances
    const bids = await createBids(lots, users);
    if (bids.length === 0) {
      console.warn('⚠️ Nenhum lance foi criado.');
    }
    
    // 8. Criar documentos
    const documents = await createDocuments(assets, users);
    if (documents.length === 0) {
      console.warn('⚠️ Nenhum documento foi criado.');
    }
    
    // 9. Criar notificações
    const notifications = await createNotifications(users);
    if (notifications.length === 0) {
      console.warn('⚠️ Nenhuma notificação foi criada.');
    }
    
    console.log('✨ Seed concluído com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`- Tenants: ${tenants.length}`);
    console.log(`- Roles: ${roles.length}`);
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
