
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const sellers = await prisma.seller.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            email: true
        }
    });
    console.log(JSON.stringify(sellers, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
