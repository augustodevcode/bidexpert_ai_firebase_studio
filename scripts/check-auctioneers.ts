import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const auctioneers = await prisma.auctioneer.findMany({
    select: {
      id: true,
      publicId: true,
      name: true,
      slug: true,
      tenantId: true
    }
  });
  console.log('Auctioneers:', JSON.stringify(auctioneers.map(a => ({
    ...a,
    id: a.id.toString(),
    tenantId: a.tenantId.toString()
  })), null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
