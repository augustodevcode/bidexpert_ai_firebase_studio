
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany();
  console.log('Roles:');
  roles.forEach(r => {
    console.log(`- Name: ${r.name}, Normalized: ${r.nameNormalized}, ID: ${r.id}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
