
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const replacer = (key: string, value: any) =>
  typeof value === 'bigint' ? value.toString() : value;

async function main() {
  const asset = await prisma.asset.findUnique({
    where: { id: 2 },
    include: { category: true }
  });
  console.log('Asset 2:', JSON.stringify(asset, replacer, 2));
  await prisma.$disconnect();
}
main();
