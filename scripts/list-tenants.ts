
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log('Existing Tenants:');
  console.table(tenants);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
