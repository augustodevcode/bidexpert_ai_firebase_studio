import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSellers() {
  try {
    const sellers = await prisma.seller.findMany({
      include: { user: true }
    });

    console.log(`Sellers encontrados: ${sellers.length}`);
    sellers.forEach(s => {
      console.log(`- ${s.name} (${s.user?.email})`);
    });
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSellers();