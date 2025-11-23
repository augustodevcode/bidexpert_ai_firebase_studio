import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 VERIFICANDO TENANT_ID DOS LOTES (BENS/ATIVOS)\n');
  
  // Contar lotes por tenant
  const lotsByTenant = await prisma.$queryRaw`
    SELECT 
      tenantId,
      COUNT(*) as total
    FROM Lot
    GROUP BY tenantId
    ORDER BY tenantId
  `;
  
  console.log('📊 DISTRIBUIÇÃO DE LOTES POR TENANT:\n');
  console.log(lotsByTenant);
  console.log('');
  
  // Verificar especificamente o Tenant 1
  const lotsInTenant1 = await prisma.lot.count({
    where: { tenantId: 1 }
  });
  
  console.log(`Lotes no Tenant ID 1: ${lotsInTenant1}\n`);
  
  // Buscar lotes que NÃO estão no Tenant 1
  const lotsNotInTenant1 = await prisma.lot.findMany({
    where: {
      tenantId: {
        not: 1
      }
    },
    select: {
      id: true,
      publicId: true,
      title: true,
      tenantId: true,
      auctionId: true
    }
  });
  
  if (lotsNotInTenant1.length > 0) {
    console.log(`⚠️  ENCONTRADOS ${lotsNotInTenant1.length} LOTES FORA DO TENANT 1:\n`);
    lotsNotInTenant1.forEach((lot, index) => {
      console.log(`${index + 1}. ID: ${lot.id} | Tenant: ${lot.tenantId}`);
      console.log(`   Título: ${lot.title}`);
      console.log(`   Public ID: ${lot.publicId || 'N/A'}`);
      console.log(`   Auction ID: ${lot.auctionId}`);
      console.log('');
    });
    
    console.log('\n🔄 CORREÇÃO NECESSÁRIA: Movendo lotes para Tenant 1...\n');
    
    const updated = await prisma.lot.updateMany({
      where: {
        tenantId: {
          not: 1
        }
      },
      data: {
        tenantId: 1
      }
    });
    
    console.log(`✅ ${updated.count} lotes movidos para Tenant ID 1\n`);
  } else {
    console.log('✅ Todos os lotes já estão no Tenant ID 1\n');
  }
  
  // Verificar também os leilões
  console.log('\n🔨 VERIFICANDO LEILÕES (AUCTIONS):\n');
  
  const auctionsByTenant = await prisma.$queryRaw`
    SELECT 
      tenantId,
      COUNT(*) as total
    FROM Auction
    GROUP BY tenantId
    ORDER BY tenantId
  `;
  
  console.log('Distribuição de Leilões por Tenant:');
  console.log(auctionsByTenant);
  console.log('');
  
  const auctionsNotInTenant1 = await prisma.auction.count({
    where: {
      tenantId: {
        not: 1
      }
    }
  });
  
  if (auctionsNotInTenant1 > 0) {
    console.log(`⚠️  ${auctionsNotInTenant1} leilões fora do Tenant 1. Corrigindo...\n`);
    
    const updatedAuctions = await prisma.auction.updateMany({
      where: {
        tenantId: {
          not: 1
        }
      },
      data: {
        tenantId: 1
      }
    });
    
    console.log(`✅ ${updatedAuctions.count} leilões movidos para Tenant ID 1\n`);
  } else {
    console.log('✅ Todos os leilões já estão no Tenant ID 1\n');
  }
  
  // Verificação final
  console.log('\n📋 VERIFICAÇÃO FINAL:\n');
  
  const finalCheck = await prisma.tenant.findFirst({
    where: { id: 1 },
    include: {
      _count: {
        select: {
          auctions: true,
          lots: true,
          users: true
        }
      }
    }
  });
  
  console.log(`Tenant ID 1 (${finalCheck?.name}):`);
  console.log(`  Leilões: ${finalCheck?._count.auctions}`);
  console.log(`  Lotes/Ativos: ${finalCheck?._count.lots}`);
  console.log(`  Usuários: ${finalCheck?._count.users}`);
  console.log('');

  await prisma.$disconnect();
}

main().catch(console.error);
