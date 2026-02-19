// Script de seed para SQLite local
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco SQLite...');

  // Criar Tenant
  const tenant = await prisma.tenant.create({
    data: {
      publicId: 'TENANT-001',
      name: 'BidExpert Demo',
      slug: 'bidexpert-demo',
    },
  });
  console.log('✅ Tenant criado:', tenant.id);

  // Criar usuário admin
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      publicId: 'USER-001',
      email: 'admin@bidexpert.com.br',
      name: 'Administrador',
      passwordHash,
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });
  console.log('✅ Usuário admin criado:', admin.email);

  // Criar usuário leiloeiro
  const auctioneerUser = await prisma.user.create({
    data: {
      publicId: 'USER-002',
      email: 'leiloeiro@bidexpert.com.br',
      name: 'Leiloeiro Teste',
      passwordHash: await bcrypt.hash('leiloeiro123', 10),
      role: 'AUCTIONEER',
      tenantId: tenant.id,
    },
  });
  console.log('✅ Usuário leiloeiro criado:', auctioneerUser.email);

  // Criar usuário comprador
  const bidderUser = await prisma.user.create({
    data: {
      publicId: 'USER-003',
      email: 'comprador@bidexpert.com.br',
      name: 'Comprador Teste',
      passwordHash: await bcrypt.hash('comprador123', 10),
      role: 'BIDDER',
      tenantId: tenant.id,
    },
  });
  console.log('✅ Usuário comprador criado:', bidderUser.email);

  // Criar Leiloeiro
  const auctioneer = await prisma.auctioneer.create({
    data: {
      publicId: 'AUCTIONEER-001',
      name: 'Leiloeiro Oficial',
      slug: 'leiloeiro-oficial',
      description: 'Leiloeiro oficial do sistema',
      email: 'contato@leiloeiro.com.br',
      phone: '(11) 99999-9999',
      tenantId: tenant.id,
    },
  });
  console.log('✅ Leiloeiro criado:', auctioneer.name);

  // Criar Vendedor
  const seller = await prisma.seller.create({
    data: {
      publicId: 'SELLER-001',
      name: 'Vendedor Oficial',
      slug: 'vendedor-oficial',
      description: 'Vendedor oficial do sistema',
      email: 'contato@vendedor.com.br',
      phone: '(11) 88888-8888',
      tenantId: tenant.id,
    },
  });
  console.log('✅ Vendedor criado:', seller.name);

  // Criar Categorias
  const categories = await Promise.all([
    prisma.lotCategory.create({
      data: {
        slug: 'imoveis',
        name: 'Imóveis',
        description: 'Leilões de imóveis residenciais e comerciais',
      },
    }),
    prisma.lotCategory.create({
      data: {
        slug: 'veiculos',
        name: 'Veículos',
        description: 'Leilões de veículos novos e usados',
      },
    }),
    prisma.lotCategory.create({
      data: {
        slug: 'moveis',
        name: 'Móveis e Utensílios',
        description: 'Leilões de móveis e utensílios domésticos',
      },
    }),
  ]);
  console.log('✅ Categorias criadas:', categories.length);

  // Criar Leilão
  const auction = await prisma.auction.create({
    data: {
      publicId: 'AUCTION-001',
      slug: 'leilao-demo-2024',
      title: 'Leilão Demonstração 2024',
      description: 'Leilão de demonstração do sistema BidExpert',
      status: 'ABERTO',
      auctionDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      totalLots: 3,
      tenantId: tenant.id,
    },
  });
  console.log('✅ Leilão criado:', auction.title);

  // Criar Lotes
  const lots = await Promise.all([
    prisma.lot.create({
      data: {
        publicId: 'LOT-001',
        auctionId: auction.id,
        number: '001',
        title: 'Apartamento 2 quartos - Centro',
        description: 'Apartamento com 2 quartos, sala, cozinha e banheiro no centro da cidade',
        slug: 'apartamento-2-quartos-centro',
        price: 150000,
        initialPrice: 100000,
        status: 'ABERTO',
        type: 'IMOVEL',
        condition: 'BOM',
        tenantId: tenant.id,
      },
    }),
    prisma.lot.create({
      data: {
        publicId: 'LOT-002',
        auctionId: auction.id,
        number: '002',
        title: 'Honda Civic 2020',
        description: 'Honda Civic LX 2020, prata, com 30.000km',
        slug: 'honda-civic-2020',
        price: 85000,
        initialPrice: 70000,
        status: 'ABERTO',
        type: 'VEICULO',
        condition: 'EXCELENTE',
        tenantId: tenant.id,
      },
    }),
    prisma.lot.create({
      data: {
        publicId: 'LOT-003',
        auctionId: auction.id,
        number: '003',
        title: 'Conjunto de Móveis de Escritório',
        description: 'Conjunto completo de móveis de escritório: mesa, cadeira, estante',
        slug: 'moveis-escritorio',
        price: 5000,
        initialPrice: 3000,
        status: 'ABERTO',
        type: 'MOVEL',
        condition: 'REGULAR',
        tenantId: tenant.id,
      },
    }),
  ]);
  console.log('✅ Lotes criados:', lots.length);

  // Criar PlatformSettings
  const settings = await prisma.platformSettings.create({
    data: {
      tenantId: tenant.id,
      siteTitle: 'BidExpert - Plataforma de Leilões',
      siteTagline: 'A melhor plataforma de leilões do Brasil',
      isSetupComplete: true,
      primaryColor: '220 90% 56%',
    },
  });
  console.log('✅ Configurações criadas');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Usuários de teste:');
  console.log('   - admin@bidexpert.com.br / admin123');
  console.log('   - leiloeiro@bidexpert.com.br / leiloeiro123');
  console.log('   - comprador@bidexpert.com.br / comprador123');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
