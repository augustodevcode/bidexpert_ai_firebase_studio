// scripts/seed-simple.ts
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
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Leilões Brasil',
      subdomain: 'leiloes-brasil',
    }
  });
  console.log(`✅ Tenant criado: ${tenant.name} (ID: ${tenant.id})`);

  // 2. Criar Configurações da Plataforma
  console.log('\n2. Configurando plataforma...');
  await prisma.platformSettings.create({
    data: {
      siteTitle: 'Leilões Brasil',
      siteTagline: 'Plataforma de leilões online',
      logoUrl: 'https://via.placeholder.com/150x50?text=Leilões+Brasil',
      isSetupComplete: true,
      tenantId: tenant.id
    }
  });

  // 3. Criar Funções (Roles)
  console.log('\n3. Criando funções...');
  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      nameNormalized: 'admin',
      description: 'Administrador do sistema',
      permissions: ['*']
    }
  });

  const bidderRole = await prisma.role.create({
    data: {
      name: 'BIDDER',
      nameNormalized: 'bidder',
      description: 'Arrematante',
      permissions: ['bid:create', 'bid:read']
    }
  });

  // 4. Criar Usuário Admin
  console.log('\n4. Criando usuário administrador...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@bidexpert.com.br',
      password: await hash('admin123', 10),
      fullName: 'Administrador do Sistema',
      cpf: '00000000000',
      roles: {
        create: [{
          role: { connect: { id: adminRole.id } },
          assignedBy: 'system'
        }]
      },
      tenants: {
        create: [{
          tenantId: tenant.id,
          assignedBy: 'system'
        }]
      }
    }
  });
  console.log(`✅ Usuário admin criado: ${admin.email}`);

  // 5. Criar Leiloeiro
  console.log('\n5. Criando leiloeiro...');
  const auctioneer = await prisma.auctioneer.create({
    data: {
      name: 'Leiloeiro Oficial',
      publicId: 'leiloeiro-oficial',
      slug: 'leiloeiro-oficial',
      description: 'Leiloeiro oficial do sistema',
      registrationNumber: '12345678000199',
      email: 'leiloeiro@bidexpert.com.br',
      phone: '+5511988888888',
      address: 'Rua dos Leilões, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01311000',
      tenantId: tenant.id
    }
  });
  console.log(`✅ Leiloeiro criado: ${auctioneer.name}`);

  // 6. Criar Comitente
  console.log('\n6. Criando comitente...');
  const seller = await prisma.seller.create({
    data: {
      name: 'Comitente Exemplo',
      publicId: 'comitente-exemplo',
      slug: 'comitente-exemplo',
      email: 'comitente@exemplo.com',
      phone: '+5511977777777',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310100',
      tenantId: tenant.id
    }
  });
  console.log(`✅ Comitente criado: ${seller.name}`);

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
        description: category.description
      }
    });
    createdCategories.push(created);
    console.log(`✅ Categoria criada: ${category.name}`);
  }

  // 8. Criar Ativos (Bens)
  console.log('\n8. Criando ativos...');
  const realEstateCategory = createdCategories.find(c => c.slug === 'imoveis');
  const vehicleCategory = createdCategories.find(c => c.slug === 'veiculos');

  if (!realEstateCategory || !vehicleCategory) {
    throw new Error('Categorias necessárias não encontradas');
  }

  // Criar ativo 1 - Imóvel
  const asset1 = await prisma.asset.create({
    data: {
      title: 'Apartamento de Luxo',
      publicId: 'apto-luxo-001',
      description: 'Apartamento de 3 quartos, 200m², cobertura com vista para o mar',
      status: 'DISPONIVEL',
      evaluationValue: 1500000,
      categoryId: realEstateCategory.id,
      sellerId: seller.id,
      tenantId: tenant.id
    }
  });
  console.log(`✅ Ativo criado: ${asset1.title}`);

  // Criar ativo 2 - Veículo
  const asset2 = await prisma.asset.create({
    data: {
      title: 'Honda Civic 2020',
      publicId: 'honda-civic-001',
      description: 'Honda Civic EXL 2.0 16V Flexone 4p Automático',
      status: 'DISPONIVEL',
      evaluationValue: 120000,
      categoryId: vehicleCategory.id,
      sellerId: seller.id,
      tenantId: tenant.id
    }
  });
  console.log(`✅ Ativo criado: ${asset2.title}`);

  // 9. Criar Leilão
  console.log('\n9. Criando leilão...');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7); // 7 dias a partir de agora
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30); // 30 dias de duração

  const auction = await prisma.auction.create({
    data: {
      title: 'Leilão de Imóveis e Veículos',
      description: 'Excelentes oportunidades em imóveis e veículos',
      auctionDate: startDate,
      endDate: endDate,
      auctioneerId: auctioneer.id,
      sellerId: seller.id,
      auctionType: 'PARTICULAR',
      status: 'RASCUNHO',
      tenantId: tenant.id
    }
  });
  console.log(`✅ Leilão criado: ${auction.title}`);

  // 10. Criar Lotes
  console.log('\n10. Criando lotes...');
  
  // Lote 1 - Apartamento
  const lot1 = await prisma.lot.create({
    data: {
      title: 'Lote 1 - Apartamento de Luxo',
      description: 'Excelente apartamento em Copacabana',
      initialPrice: 10000,
      status: 'RASCUNHO',
      price: 1400000,
      type: 'STANDARD',
      auctionId: auction.id,
      tenantId: tenant.id,
      assets: {
        create: [{
          assetId: asset1.id,
          assignedBy: 'system'
        }]
      }
    }
  });
  console.log(`✅ Lote criado: ${lot1.title}`);

  // Lote 2 - Veículo
  const lot2 = await prisma.lot.create({
    data: {
      title: 'Lote 2 - Honda Civic 2020',
      description: 'Semi-novo, único dono, revisões em dia',
      initialPrice: 5000,
      status: 'RASCUNHO',
      price: 110000,
      type: 'STANDARD',
      auctionId: auction.id,
      tenantId: tenant.id,
      assets: {
        create: [{
          assetId: asset2.id,
          assignedBy: 'system'
        }]
      }
    }
  });
  console.log(`✅ Lote criado: ${lot2.title}`);

  // 11. Criar Usuários Participantes
  console.log('\n11. Criando usuários participantes...');
  
  // Usuário 1
  const user1 = await prisma.user.create({
    data: {
      email: 'comprador1@exemplo.com',
      password: await hash('senha123', 10),
      fullName: 'João Silva',
      cpf: '11111111111',
      street: 'Rua das Flores',
      number: '123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234000',
      roles: {
        create: [{
          roleId: bidderRole.id,
          assignedBy: 'system'
        }]
      },
      tenants: {
        create: [{
          tenantId: tenant.id,
          assignedBy: 'system'
        }]
      }
    }
  });
  console.log(`✅ Usuário criado: ${user1.email}`);

  // Usuário 2
  const user2 = await prisma.user.create({
    data: {
      email: 'comprador2@exemplo.com',
      password: await hash('senha123', 10),
      fullName: 'Maria Oliveira',
      cpf: '22222222222',
      street: 'Av. Paulista',
      number: '1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310000',
      roles: {
        create: [{
          roleId: bidderRole.id,
          assignedBy: 'system'
        }]
      },
      tenants: {
        create: [{
          tenantId: tenant.id,
          assignedBy: 'system'
        }]
      }
    }
  });
  console.log(`✅ Usuário criado: ${user2.email}`);

  // 12. Simular Lances
  console.log('\n12. Simulando lances...');
  
  // Lance 1
  await prisma.bid.create({
    data: {
      amount: 1450000,
      lotId: lot1.id,
      bidderId: user1.id,
      auctionId: auction.id,
      tenantId: tenant.id
    }
  });
  console.log(`✅ Lance de R$ 1.450.000,00 criado para o lote 1`);

  // Lance 2
  await prisma.bid.create({
    data: {
      amount: 1500000,
      lotId: lot1.id,
      bidderId: user2.id,
      auctionId: auction.id,
      tenantId: tenant.id
    }
  });
  console.log(`✅ Lance de R$ 1.500.000,00 criado para o lote 1`);

  // Lance 3
  await prisma.bid.create({
    data: {
      amount: 115000,
      lotId: lot2.id,
      bidderId: user1.id,
      auctionId: auction.id,
      tenantId: tenant.id
    }
  });
  console.log(`✅ Lance de R$ 115.000,00 criado para o lote 2`);

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
