
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenantId = 'bidexpert-630df'; // Assuming this is the tenant ID, or I can fetch one.
    // Actually, let's just find any seller and check the structure.
    const seller = await prisma.seller.findFirst({
        include: {
            user: true,
            judicialBranch: true,
            _count: {
                select: { lots: true }
            }
        }
    });

    console.log('Seller from Prisma:', JSON.stringify(seller, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
    , 2));

    if ((seller as any)?.lots) {
        console.log('Seller HAS lots!');
    } else {
        console.log('Seller does NOT have lots.');
    }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
