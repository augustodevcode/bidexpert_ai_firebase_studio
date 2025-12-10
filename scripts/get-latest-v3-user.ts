
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.user.findFirst({
        where: { email: { startsWith: 'test.leiloeiro.' } },
        orderBy: { createdAt: 'desc' }
    });
    console.log('Latest V3 Admin:', user?.email);
}
main();
