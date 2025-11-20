import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    include: {
      tenants: true,
    },
  });

  console.log('Users and Tenants:');
  users.forEach(u => {
    console.log(`User: ${u.email} (ID: ${u.id})`);
    u.tenants.forEach(t => {
      console.log(`  - Tenant ID: ${t.tenantId}`);
    });
  });
  
  const tenants = await prisma.tenant.findMany();
  console.log('Tenants:');
  tenants.forEach(t => {
      console.log(`Tenant: ${t.name} (ID: ${t.id})`);
  });
}

check()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
