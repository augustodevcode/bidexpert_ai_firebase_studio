import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Criando tenants...');

  const tenant1 = await prisma.tenant.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      id: BigInt(1),
      name: 'Tenant Principal',
      subdomain: 'principal'
    }
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { id: BigInt(2) },
    update: {},
    create: {
      id: BigInt(2),
      name: 'Leiloeiro B',
      subdomain: 'leiloeiro-b'
    }
  });

  console.log('✅ Tenants criados:');
  console.log(`   - ${tenant1.name} (ID: ${tenant1.id})`);
  console.log(`   - ${tenant2.name} (ID: ${tenant2.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
