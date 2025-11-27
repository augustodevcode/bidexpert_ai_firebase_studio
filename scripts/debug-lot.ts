
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const lot = await prisma.lot.findUnique({
        where: { id: 577 },
        include: {
            auction: true,
            seller: true,
            category: true,
            subcategory: true,
            assets: true
        }
    });

    console.log('Lot 577:', JSON.stringify(lot, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
    , 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
