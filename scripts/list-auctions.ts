import { prisma } from '../src/lib/prisma';

async function main() {
  const auctions = await prisma.auction.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true }
  });
  console.log(JSON.stringify(auctions, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
