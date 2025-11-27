import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 VERIFICANDO TENANT IDs DOS ATIVOS CRIADOS\n');
  
  // Buscar tenants criados na última execução
  const tenants = await prisma.tenant.findMany({
    where: {
      subdomain: {
        contains: '1763696926849'
      }
    },
    select: {
      id: true,
      name: true,
      subdomain: true,
      _count: {
        select: {
          auctions: true,
          lots: true,
          users: true
        }
      }
    }
  });

  console.log('📦 TENANTS CRIADOS (última execução):\n');
  tenants.forEach((tenant, index) => {
    console.log(`${index + 1}. ID: ${tenant.id}`);
    console.log(`   Nome: ${tenant.name}`);
    console.log(`   Subdomain: ${tenant.subdomain}`);
    console.log(`   Leilões: ${tenant._count.auctions}`);
    console.log(`   Lotes: ${tenant._count.lots}`);
    console.log(`   Usuários: ${tenant._count.users}`);
    console.log('');
  });

  // Buscar todos os tenants
  const allTenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      subdomain: true,
      createdAt: true,
      _count: {
        select: {
          auctions: true,
          lots: true,
          users: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log('\n📋 TODOS OS TENANTS NO SISTEMA:\n');
  allTenants.forEach((tenant, index) => {
    console.log(`${index + 1}. ID: ${tenant.id}`);
    console.log(`   Nome: ${tenant.name}`);
    console.log(`   Subdomain: ${tenant.subdomain}`);
    console.log(`   Leilões: ${tenant._count.auctions}`);
    console.log(`   Lotes: ${tenant._count.lots}`);
    console.log(`   Usuários: ${tenant._count.users}`);
    console.log(`   Criado: ${tenant.createdAt}`);
    console.log('');
  });

  // Buscar leilões e seus tenant IDs
  console.log('\n🔨 LEILÕES E SEUS TENANT IDs:\n');
  const auctions = await prisma.auction.findMany({
    where: {
      publicId: {
        contains: '1763696926849'
      }
    },
    select: {
      id: true,
      publicId: true,
      title: true,
      tenantId: true,
      tenant: {
        select: {
          name: true,
          subdomain: true
        }
      },
      _count: {
        select: {
          lots: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  auctions.forEach((auction, index) => {
    console.log(`${index + 1}. ${auction.title}`);
    console.log(`   Auction ID: ${auction.id}`);
    console.log(`   Public ID: ${auction.publicId}`);
    console.log(`   Tenant ID: ${auction.tenantId}`);
    console.log(`   Tenant: ${auction.tenant?.name || 'N/A'}`);
    console.log(`   Subdomain: ${auction.tenant?.subdomain || 'N/A'}`);
    console.log(`   Lotes: ${auction._count.lots}`);
    console.log('');
  });

  // Buscar lotes e seus tenant IDs
  console.log('\n📦 LOTES E SEUS TENANT IDs:\n');
  const lots = await prisma.lot.findMany({
    where: {
      auction: {
        publicId: {
          contains: '1763696926849'
        }
      }
    },
    select: {
      id: true,
      publicId: true,
      title: true,
      tenantId: true,
      auctionId: true,
      tenant: {
        select: {
          name: true,
          subdomain: true
        }
      },
      auction: {
        select: {
          title: true
        }
      }
    },
    take: 10
  });

  lots.forEach((lot, index) => {
    console.log(`${index + 1}. ${lot.title}`);
    console.log(`   Lot ID: ${lot.id}`);
    console.log(`   Public ID: ${lot.publicId || 'N/A'}`);
    console.log(`   Tenant ID: ${lot.tenantId}`);
    console.log(`   Tenant: ${lot.tenant?.name || 'N/A'}`);
    console.log(`   Leilão: ${lot.auction?.title || 'N/A'}`);
    console.log('');
  });

  await prisma.$disconnect();
}

main().catch(console.error);
