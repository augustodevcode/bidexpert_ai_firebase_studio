
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const auctions = await prisma.auction.findMany({
    select: { title: true, id: true, tenantId: true }
  });
  console.log('Auctions found:', auctions);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
