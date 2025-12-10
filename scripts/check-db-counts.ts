// scripts/check-db-counts.ts
import { prisma } from '../src/lib/prisma';

async function main() {
  try {
    const auctionsCount = await prisma.auction.count();
    const lotsCount = await prisma.lot.count();
    const directSaleOffersCount = await prisma.directSaleOffer.count();
    
    // Count by status for auctions
    const auctionsByStatus = await prisma.auction.groupBy({
      by: ['status'],
      _count: true
    });
    
    // Count by status for lots
    const lotsByStatus = await prisma.lot.groupBy({
      by: ['status'],
      _count: true
    });
    
    // Count by status for direct sale offers
    const offersByStatus = await prisma.directSaleOffer.groupBy({
      by: ['status'],
      _count: true
    });
    
    console.log('=== DATABASE COUNTS ===');
    console.log('Total Auctions:', auctionsCount);
    console.log('Total Lots:', lotsCount);
    console.log('Total DirectSaleOffers:', directSaleOffersCount);
    
    console.log('\n=== AUCTIONS BY STATUS ===');
    auctionsByStatus.forEach(s => console.log(`  ${s.status}: ${s._count}`));
    
    console.log('\n=== LOTS BY STATUS ===');
    lotsByStatus.forEach(s => console.log(`  ${s.status}: ${s._count}`));
    
    console.log('\n=== DIRECT SALES BY STATUS ===');
    offersByStatus.forEach(s => console.log(`  ${s.status}: ${s._count}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
