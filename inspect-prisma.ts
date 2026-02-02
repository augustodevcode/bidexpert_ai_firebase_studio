
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Keys on prisma client:');
  const keys = Object.keys(prisma);
  // Filter for model names (usually start with lowercase, exclude $ methods)
  const models = keys.filter(k => !k.startsWith('$') && !k.startsWith('_'));
  console.log(models.join(', '));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
