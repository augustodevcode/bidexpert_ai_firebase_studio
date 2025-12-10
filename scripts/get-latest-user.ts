
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const admin = await prisma.user.findUnique({
        where: { email: 'admin@bidexpert.com.br' }
    });
    console.log('Standard Admin:', admin ? 'FOUND' : 'NOT FOUND');

    const testLeiloeiros = await prisma.user.findMany({
        where: { email: { contains: 'test.leiloeiro' } },
        orderBy: { createdAt: 'desc' },
        take: 1
    });
    console.log('Latest Test Leiloeiro:', testLeiloeiros[0]?.email || 'NOT FOUND');
}
main();
