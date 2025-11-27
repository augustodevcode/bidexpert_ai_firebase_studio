import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAuctions() {
  const auctions = await prisma.auction.findMany({
    take: 10,
    orderBy: { id: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      tenantId: true
    }
  });

  console.log('Últimos 10 leilões:');
  auctions.forEach(a => {
    console.log(`ID: ${a.id}, Título: ${a.title}, Status: ${a.status}, TenantID: ${a.tenantId}`);
  });

  const total = await prisma.auction.count();
  console.log(`\n📊 Total de leilões: ${total}`);

  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true }
  });

  console.log('\n📋 Tenants:');
  for (const tenant of tenants) {
    const count = await prisma.auction.count({
      where: { tenantId: tenant.id }
    });
    console.log(`   ${tenant.name} (ID: ${tenant.id}): ${count} leilões`);
  }

  await prisma.$disconnect();
}

checkAuctions().catch(console.error);

