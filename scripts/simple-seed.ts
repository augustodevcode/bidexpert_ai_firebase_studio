// scripts/simple-seed.ts
/**
 * @fileoverview Script de seed simplificado para a plataforma BidExpert
 * Cria dados básicos para teste, respeitando o schema do Prisma
 */

import { Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';

import { TenantService } from '../src/services/tenant.service';
import { RoleService } from '../src/services/role.service';
import { UserService } from '../src/services/user.service';
import { AuctioneerService } from '../src/services/auctioneer.service';
import { SellerService } from '../src/services/seller.service';
import { AuctionService } from '../src/services/auction.service';
import { CategoryService } from '../src/services/category.service';
import { AssetService } from '../src/services/asset.service';
import { LotService } from '../src/services/lot.service';
import { BidService } from '../src/services/bid.service';
import { PlatformSettingsService } from '../src/services/platform-settings.service';

const services = {
    tenant: new TenantService(),
    role: new RoleService(),
    user: new UserService(),
    auctioneer: new AuctioneerService(),
    seller: new SellerService(),
    auction: new AuctionService(),
    category: new CategoryService(),
    asset: new AssetService(),
    lot: new LotService(),
    bid: new BidService(),
    platformSettings: new PlatformSettingsService(),
};

async function main() {
  console.log('🚀 Iniciando seed simplificado...');

  // 1. Criar Tenant (Inquilino)
  console.log('\n1. Criando tenant...');
  const { tenant } = await services.tenant.createTenant({
      name: 'Leilões Brasil',
      subdomain: 'leiloes-brasil',
  });

  // 1.1 Criar configurações da plataforma
  await services.platformSettings.createOrUpdateSettings(tenant.id.toString(), {
      siteTitle: 'Leilões Brasil',
      siteTagline: 'Plataforma de leilões online',
      isSetupComplete: true,
      }
    },
    include: {
      settings: true
    }
  });
  console.log(`✅ Tenant criado: ${tenant.name} (ID: ${tenant.id})`);

  // 2. Criar Funções (Roles)
  console.log('\n2. Criando funções...');
  const rolesData = [
    {
      name: 'Administrator',
      nameNormalized: 'ADMINISTRATOR',
      description: 'Administrador do sistema',
      permissions: ['manage_all']
    },
    {
      name: 'Bidder',
      nameNormalized: 'BIDDER',
      description: 'Arrematante',
      permissions: ['bid:create', 'bid:read']
    },
    {
      name: 'Auctioneer',
      nameNormalized: 'AUCTIONEER',
      description: 'Leiloeiro',
      permissions: ['auction:create', 'auction:update', 'lot:create', 'lot:update']
    },
    { 
      name: 'SELLER',
      nameNormalized: 'seller',
      description: 'Comitente',
      permissions: ['lot:create', 'lot:update']
    }
  ];

  const createdRoles = {};
  for (const role of rolesData) {
    const roleResult = await services.role.createRole({
      name: role.name,
      nameNormalized: role.nameNormalized,
      description: role.description,
      permissions: role.permissions,
    });
    if (roleResult.success && roleResult.roleId) {
      createdRoles[role.nameNormalized] = await services.role.getRoleById(roleResult.roleId);
    }  // 3. Criar Usuário Admin
  console.log('\n3. Criando usuário administrador...');
  const adminRole = createdRoles.find(r => r.name === 'ADMIN');
  if (!adminRole) throw new Error('Função de administrador não encontrada');

    const adminUserResult = await services.user.createUser({
    email: 'admin@example.com',
    fullName: 'Administrador',
    password: 'admin123',
    habilitationStatus: 'HABILITADO',
    accountType: 'LEGAL',
    roleIds: [String(createdRoles['ADMINISTRATOR'].id)],
    tenantId: tenant.id.toString(),
  });
  if (!adminUserResult.success || !adminUserResult.userId) throw new Error(adminUserResult.message);
  const adminUser = await services.user.getUserById(adminUserResult.userId.toString());
  console.log(`✅ Usuário admin criado: ${admin.email}`);

  // 4. Criar Leiloeiro
  console.log('\n4. Criando leiloeiro...');
  const auctioneerRole = createdRoles.find(r => r.name === 'AUCTIONEER');
  if (!auctioneerRole) throw new Error('Função de leiloeiro não encontrada');

    const auctioneerResult = await services.auctioneer.createAuctioneer(tenant.id.toString(), {
    name: 'Leiloeiro Oficial',
    registrationNumber: 'JUCESP-123',
    userId: adminUser.id.toString(),
    city: 'São Paulo',
    state: 'SP',
    address: 'Av. Paulista, 1000',
    zipCode: '01310-100',
    phone: '(11) 99999-9999',
    email: 'leiloeiro@example.com',
    description: 'Leiloeiro oficial com mais de 10 anos de experiência',
    logoUrl: 'https://via.placeholder.com/150x150?text=Leiloeiro',
    logoMediaId: null,
    dataAiHintLogo: null,
  });
  if (!auctioneerResult.success || !auctioneerResult.auctioneerId) throw new Error(auctioneerResult.message);
  const auctioneer = await services.auctioneer.getAuctioneerById(tenant.id.toString(), auctioneerResult.auctioneerId);
  console.log(`✅ Leiloeiro criado: ${auctioneer.name}`);

  // 5. Criar Comitente
  console.log('\n5. Criando comitente...');
    const sellerResult = await services.seller.createSeller(tenant.id.toString(), {
    name: 'Comitente Vendedor',
    isJudicial: false,
    city: 'São Paulo',
    state: 'SP',
    address: 'Rua do Comércio, 500',
    zipCode: '04538-132',
    contactName: 'João Silva',
    phone: '(11) 98888-8888',
    email: 'comitente@example.com',
    description: 'Empresa especializada em venda de ativos',
    website: 'www.example.com',
    logoUrl: 'https://via.placeholder.com/150x150?text=Comitente',
    logoMediaId: null,
    dataAiHintLogo: null,
  });
  if (!sellerResult.success || !sellerResult.sellerId) throw new Error(sellerResult.message);
  const seller = await services.seller.getSellerById(tenant.id.toString(), sellerResult.sellerId);
  console.log(`✅ Comitente criado: ${seller.name}`);

  // 6. Criar Leilão
  console.log('\n6. Criando leilão...');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7); // 7 dias a partir de agora
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30); // 30 dias de duração

  const auctionResult = await services.auction.createAuction(tenant.id.toString(), {
    title: 'Leilão de Imóveis e Veículos',
    auctionType: 'EXTRAJUDICIAL',
    status: 'EM_BREVE',
    auctioneerId: auctioneer.id.toString(),
    sellerId: seller.id.toString(),
    auctionDate: startDate,
    endDate: endDate,
    softCloseEnabled: true,
    description: 'Excelentes oportunidades em imóveis e veículos',
    termsAndConditions: 'Termos e condições do leilão...',
  });
  if (!auctionResult.success || !auctionResult.auctionId) throw new Error(auctionResult.message);
  const auction = await services.auction.getAuctionById(tenant.id.toString(), auctionResult.auctionId);
  console.log(`✅ Leilão criado: ${auction.title}`);

  // 7. Criar Categorias de Lotes
  console.log('\n7. Criando categorias de lotes...');
  const categories = [
    { name: 'Imóveis', slug: 'imoveis', description: 'Imóveis residenciais e comerciais' },
    { name: 'Veículos', slug: 'veiculos', description: 'Carros, motos e outros veículos' },
    { name: 'Eletrônicos', slug: 'eletronicos', description: 'Eletrônicos em geral' },
    { name: 'Joias', slug: 'joias', description: 'Joias e acessórios' },
    { name: 'Outros', slug: 'outros', description: 'Outros itens' }
  ];

  const createdCategories = [];
  for (const category of categories) {
    const created = await prisma.lotCategory.create({
      data: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        tenant: { connect: { id: tenant.id } }
      }
    });
    createdCategories.push(created);
    console.log(`✅ Categoria criada: ${created.name}`);
  }

  // 8. Criar Ativos (Bens)
  console.log('\n8. Criando ativos...');
  const realEstateCategory = createdCategories.find(c => c.slug === 'imoveis');
  const vehicleCategory = createdCategories.find(c => c.slug === 'veiculos');

  if (!realEstateCategory || !vehicleCategory) {
    throw new Error('Categorias necessárias não encontradas');
  }

  const assets = [
    {
      title: 'Apartamento de Luxo',
      description: 'Apartamento de 3 quartos, 200m², cobertura com vista para o mar',
      categoryId: realEstateCategory.id,
      status: 'AVAILABLE' as const,
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
      sellerId: seller.id,
      isActive: true,
      tenant: { connect: { id: tenant.id } }
    },
    {
      title: 'Honda Civic 2020',
      description: 'Honda Civic EXL 2.0 16V Flexone 4p Automático',
      categoryId: vehicleCategory.id,
      status: 'AVAILABLE' as const,
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
      sellerId: seller.id,
      isActive: true,
      tenant: { connect: { id: tenant.id } }
    },
    {
      title: 'Casa com Piscina',
      description: 'Casa de 4 quartos, 300m², terreno de 500m², piscina e churrasqueira',
      categoryId: realEstateCategory.id,
      status: 'AVAILABLE' as const,
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
      sellerId: seller.id,
      isActive: true,
      tenant: { connect: { id: tenant.id } }
    }
  ];

  const createdAssets = [];
  for (const asset of assets) {
    const { categoryId, sellerId, ...assetData } = asset;
    const created = await prisma.asset.create({
      data: {
        ...assetData,
        publicId: `AST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        category: {
          connect: { id: categoryId }
        },
        seller: {
          connect: { id: sellerId }
        },
        tenant: { connect: { id: tenant.id } }
      }
    });
    createdAssets.push(created);
    console.log(`✅ Ativo criado: ${created.title}`);
  }

  // 9. Criar Lotes
  console.log('\n9. Criando lotes...');
  const lots = [
    {
      auctionId: auction.id,
      title: 'Lote 1 - Apartamento de Luxo',
      description: 'Excelente apartamento em Copacabana',
      startingBid: 1400000,
      minIncrement: 10000,
      status: 'PENDING',
      isActive: true,
      tenant: { connect: { id: tenant.id } },
      assets: {
        connect: { id: createdAssets[0].id }
      }
    },
    {
      auctionId: auction.id,
      title: 'Lote 2 - Honda Civic 2020',
      description: 'Semi-novo, único dono, revisões em dia',
      startingBid: 110000,
      minIncrement: 5000,
      status: 'PENDING',
      isActive: true,
      tenant: { connect: { id: tenant.id } },
      assets: {
        connect: { id: createdAssets[1].id }
      }
    },
    {
      auctionId: auction.id,
      title: 'Lote 3 - Casa com Piscina',
      description: 'Excelente casa em condomínio fechado',
      startingBid: 1700000,
      minIncrement: 20000,
      status: 'PENDING',
      isActive: true,
      tenant: { connect: { id: tenant.id } },
      assets: {
        connect: { id: createdAssets[2].id }
      }
    }
  ];

  const createdLots = [];
  for (const lot of lots) {
    const { auctionId, assets, ...lotData } = lot;
    const created = await prisma.lot.create({
      data: {
        ...lotData,
        status: 'PENDING' as const,
        type: 'STANDARD',
        price: lot.startingBid,
        auction: {
          connect: { id: auctionId }
        },
        tenant: { connect: { id: tenant.id } }
      }
    });
    createdLots.push(created);
    console.log(`✅ Lote criado: ${created.title}`);
  }

  // 10. Criar Usuários Participantes
  console.log('\n10. Criando usuários participantes...');
  const bidderRole = createdRoles.find(r => r.name === 'BIDDER');
  if (!bidderRole) throw new Error('Função de arrematante não encontrada');

  const users = [
    {
      email: 'comprador1@exemplo.com',
      password: await hash('senha123', 10),
      fullName: 'João Silva',
      cpf: '11111111111',
      phone: '+5511999999999',
      isActive: true,
      emailVerified: new Date(),
      roles: {
        create: [{
          roleId: bidderRole.id
        }]
      },
      address: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234000',
      tenant: { connect: { id: tenant.id } }
    },
    {
      email: 'comprador2@exemplo.com',
      password: await hash('senha123', 10),
      fullName: 'Maria Oliveira',
      cpf: '22222222222',
      phone: '+5511888888888',
      isActive: true,
      emailVerified: new Date(),
      roles: {
        create: [{
          roleId: bidderRole.id
        }]
      },
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310000',
      tenant: { connect: { id: tenant.id } }
    }
  ];

  const createdUsers = [];
  for (const user of users) {
    const { roles, ...userData } = user;
    const created = await prisma.user.create({
      data: {
        ...userData,
        roles: {
          create: [{
            role: {
              connect: { id: roles.create[0].roleId }
            },
            assignedBy: 'system'
          }]
        },
        tenant: { connect: { id: tenant.id } }
      }
    });
    createdUsers.push(created);
    console.log(`✅ Usuário criado: ${created.email}`);
  }

  // 11. Simular Lances
  console.log('\n11. Simulando lances...');
  const bids = [
    {
      amount: 1450000,
      lotId: createdLots[0].id,
      userId: createdUsers[0].id,
      status: 'ACCEPTED',
      tenant: { connect: { id: tenant.id } }
    },
    {
      amount: 1500000,
      lotId: createdLots[0].id,
      userId: createdUsers[1].id,
      status: 'ACCEPTED',
      tenant: { connect: { id: tenant.id } }
    },
    {
      amount: 115000,
      lotId: createdLots[1].id,
      userId: createdUsers[0].id,
      status: 'ACCEPTED',
      tenant: { connect: { id: tenant.id } }
    }
  ];

  for (const bid of bids) {
    const { lotId, userId, ...bidData } = bid;
    await prisma.bid.create({
      data: {
        ...bidData,
        lot: {
          connect: { id: lotId }
        },
        bidderId: userId,
        auctionId: auction.id,
        tenant: { connect: { id: tenant.id } }
      }
    });
    console.log(`✅ Lance de R$ ${bid.amount.toLocaleString('pt-BR')} criado para o lote ${lotId}`);
  }

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n🔑 Credenciais de Acesso:');
  console.log('----------------------');
  console.log('Admin: admin@bidexpert.com.br / admin123');
  console.log('Comprador 1: comprador1@exemplo.com / senha123');
  console.log('Comprador 2: comprador2@exemplo.com / senha123');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
