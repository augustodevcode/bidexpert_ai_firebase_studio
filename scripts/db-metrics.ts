// scripts/db-metrics.ts
import 'dotenv/config';
import { prisma } from '@/lib/prisma';

async function main() {
  const [tenants, users, auctions, lots, bids, sellers, auctioneers] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.auction.count(),
    prisma.lot.count(),
    prisma.bid.count(),
    prisma.seller.count(),
    prisma.auctioneer.count(),
  ]);

  console.log(JSON.stringify({ tenants, users, auctions, lots, bids, sellers, auctioneers }, null, 2));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
