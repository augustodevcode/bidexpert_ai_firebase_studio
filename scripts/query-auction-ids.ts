
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const auctions = await prisma.auction.findMany({
      where: {
        id: {
          in: [BigInt(205), BigInt(206), BigInt(207), BigInt(201), BigInt(202)]
        }
      },
      select: {
        id: true,
        publicId: true,
        title: true
      }
    });

    console.log('Auctions with stages:');
    console.table(auctions.map(a => ({
      id: a.id.toString(),
      publicId: a.publicId,
      title: a.title
    })));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
