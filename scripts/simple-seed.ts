// scripts/simple-seed.ts
/**
 * @fileoverview Script de seed simplificado para a plataforma BidExpert
 * Cria dados básicos para teste, respeitando o schema do Prisma
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando seed simplificado...');

  // 1. Criar Tenant (Inquilino)
  console.log('\n1. Criando tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Leilões Brasil',
      subdomain: 'leiloes-brasil',
      settings: {
        create: {
          siteName: 'Leilões Brasil',
          siteDescription: 'Plataforma de leilões online',
          primaryColor: '#2563eb',
          logoUrl: 'https://via.placeholder.com/150x50?text=Leilões+Brasil',
          isSetupComplete: true
        }
      }
    },
    include: {
      settings: true
    }
  });
  console.log(`✅ Tenant criado: ${tenant.name} (ID: ${tenant.id})`);

  // 2. Criar Funções (Roles)
  console.log('\n2. Criando funções...');
  const roles = [
    { 
      name: 'ADMIN', 
      nameNormalized: 'admin',
      description: 'Administrador do sistema',
      permissions: ['*']
    },
    { 
      name: 'BIDDER',
      nameNormalized: 'bidder',
      description: 'Arrematante',
      permissions: ['bid:create', 'bid:read']
    },
    { 
      name: 'AUCTIONEER',
      nameNormalized: 'auctioneer',
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

  const createdRoles = [];
  for (const role of roles) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role
    });
    createdRoles.push(created);
    console.log(`✅ Função criada: ${created.name}`);
  }

  // 3. Criar Usuário Admin
  console.log('\n3. Criando usuário administrador...');
  const adminRole = createdRoles.find(r => r.name === 'ADMIN');
  if (!adminRole) throw new Error('Função de administrador não encontrada');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bidexpert.com.br' },
    update: {},
    create: {
      email: 'admin@bidexpert.com.br',
      password: await hash('admin123', 10),
      fullName: 'Administrador do Sistema',
      cpf: '00000000000',
      phone: '+5511999999999',
      isActive: true,
      emailVerified: new Date(),
      roles: {
        create: [{
          role: {
            connect: { id: adminRole.id }
          },
          assignedBy: 'system'
        }]
      },
      tenant: {
        connect: { id: tenant.id }
      }
    },
    include: {
      roles: true
    }
  });
  console.log(`✅ Usuário admin criado: ${admin.email}`);

  // 4. Criar Leiloeiro
  console.log('\n4. Criando leiloeiro...');
  const auctioneerRole = createdRoles.find(r => r.name === 'AUCTIONEER');
  if (!auctioneerRole) throw new Error('Função de leiloeiro não encontrada');

  const auctioneer = await prisma.auctioneer.create({
    data: {
      name: 'Leiloeiro Oficial',
      description: 'Leiloeiro oficial do sistema',
      cpfCnpj: '12345678000199',
      email: 'leiloeiro@bidexpert.com.br',
      phone: '+5511988888888',
      address: 'Rua dos Leilões, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01311000',
      commissionRate: 5.0,
      isActive: true,
      tenant: {
        connect: { id: tenant.id }
      }
    }
  });
  console.log(`✅ Leiloeiro criado: ${auctioneer.name}`);

  // 5. Criar Comitente
  console.log('\n5. Criando comitente...');
  const seller = await prisma.seller.create({
    data: {
      name: 'Comitente Exemplo',
      cpfCnpj: '12345678000100',
      email: 'comitente@exemplo.com',
      phone: '+5511977777777',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310100',
      contactPerson: 'João da Silva',
      contactPhone: '+5511966666666',
      contactEmail: 'joao@exemplo.com',
      isActive: true,
      tenant: {
        connect: { id: tenant.id }
      }
    }
  });
  console.log(`✅ Comitente criado: ${seller.name}`);

  // 6. Criar Leilão
  console.log('\n6. Criando leilão...');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7); // 7 dias a partir de agora
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30); // 30 dias de duração

  const auction = await prisma.auction.create({
    data: {
      title: 'Leilão de Imóveis e Veículos',
      description: 'Excelentes oportunidades em imóveis e veículos',
      startDate,
      endDate,
      auctioneerId: auctioneer.id,
      sellerId: seller.id,
      type: 'ONLINE',
      status: 'DRAFT' as const,
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
      ],
      isActive: true,
      tenant: { connect: { id: tenant.id } }
    }
  });
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
