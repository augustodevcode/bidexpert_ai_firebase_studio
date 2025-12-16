
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const replacer = (key: string, value: any) =>
    typeof value === 'bigint' ? value.toString() : value;

async function main() {
    const asset = await prisma.asset.findFirst({
        orderBy: { id: 'asc' } // or 'desc'
    });
    console.log('First Asset ID:', asset?.id.toString());
    await prisma.$disconnect();
}
main();
