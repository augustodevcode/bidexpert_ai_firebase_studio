import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.lotCategory.findMany({
    take: 8,
  });

  console.log('Top 8 Categorias:');
  categories.forEach(c => {
    console.log(`- ${c.name} (${c.slug})`);
  });

  await prisma.$disconnect();
}

main();
