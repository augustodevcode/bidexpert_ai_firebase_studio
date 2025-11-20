
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking Tenants ---');
  
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'asc' }
  });

  console.log('All Tenants (ordered by createdAt asc):');
  tenants.forEach(t => {
    console.log(`ID: ${t.id}, Name: ${t.name}, Subdomain: ${t.subdomain}, CreatedAt: ${t.createdAt}`);
  });

  const defaultTenant = await prisma.tenant.findFirst({
    orderBy: { createdAt: 'asc' }
  });
  console.log('\nDefault Tenant (ensureDefaultTenant logic):', defaultTenant?.id);

  const unorderedTenant = await prisma.tenant.findFirst();
  console.log('Unordered findFirst():', unorderedTenant?.id);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
