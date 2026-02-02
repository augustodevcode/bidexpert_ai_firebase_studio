
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Tenants ---');
  const tenants = await prisma.tenant.findMany();
  console.table(tenants.map(t => ({ id: t.id, name: t.name, subdomain: t.subdomain })));

  console.log('\n--- Lots in Tenant 3 (Demo) ---');
  const lots = await prisma.lot.findMany({
    where: { tenantId: 3 },
    take: 10,
    include: { Auction: true }
  });
  
  if (lots.length === 0) {
    console.log('No lots found for tenant 3');
  } else {
    lots.forEach(lot => {
      console.log(`ID: ${lot.id} | PublicID: ${lot.publicId} | Title: ${lot.title} | AuctionID: ${lot.auctionId} | Slug: ${lot.slug}`);
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
