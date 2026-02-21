import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const auctions = await prisma.auction.findMany({
  select: { id: true, publicId: true, title: true, status: true },
  take: 5
});
auctions.forEach(a => console.log(String(a.id), '|', a.publicId, '|', a.status, '|', a.title));

const lots = await prisma.lot.findMany({
  select: { id: true, publicId: true, status: true, auctionId: true },
  where: { status: 'ABERTO_PARA_LANCES' },
  take: 3
});
console.log('--- LOTS ---');
lots.forEach(l => console.log(String(l.id), '|', l.publicId, '|', l.status, '|', 'auction:', String(l.auctionId)));
await prisma.$disconnect();
