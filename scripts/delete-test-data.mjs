/**
 * Delete all test data in reverse dependency order.
 * Preserves: tenants, users, roles, platformSettings, permissions.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function del(table) {
  try {
    const count = await prisma.$executeRawUnsafe(`DELETE FROM \`${table}\``);
    console.log(`  ${table}: ${count} deleted`);
    return count;
  } catch (e) {
    console.log(`  ${table}: SKIP (${e.meta?.message || e.message})`);
    return 0;
  }
}

async function main() {
  console.log('=== DELETING TEST DATA ===\n');

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');

  // M2M junction tables
  await del('AssetsOnLots');
  await del('_AuctionToCourt');
  await del('_AuctionToJudicialBranch');
  await del('_AuctionToJudicialDistrict');
  await del('_JudicialProcessToLot');
  await del('_InstallmentPaymentToLot');

  // Lot children
  await del('LotRisk');
  await del('LotStagePrice');
  await del('LotDocument');
  await del('LotQuestion');
  await del('WonLot');
  await del('UserLotMaxBid');
  await del('Bid');
  await del('BidIdempotencyLog');
  await del('DirectSaleOffer');
  await del('BidderNotification');

  // Lots
  await del('Lot');

  // Auction children
  await del('AuctionStage');
  await del('AuctionHabilitation');
  await del('ParticipationHistory');

  // Auctions
  await del('Auction');

  // Assets
  await del('AssetMedia');
  await del('Asset');

  // Judicial
  await del('JudicialParty');
  await del('JudicialProcess');

  // Business entities
  await del('Seller');
  await del('Auctioneer');

  // Categories
  await del('Subcategory');
  await del('LotCategory');

  // Judiciary structure
  await del('JudicialBranch');
  await del('JudicialDistrict');
  await del('Court');

  // Geography
  await del('City');
  await del('State');

  // Media
  await del('MediaItem');

  // Vehicles
  await del('VehicleModel');
  await del('VehicleMake');

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');

  console.log('\n=== VERIFICATION ===');
  const counts = {
    states: await prisma.state.count(),
    cities: await prisma.city.count(),
    courts: await prisma.court.count(),
    sellers: await prisma.seller.count(),
    auctioneers: await prisma.auctioneer.count(),
    categories: await prisma.lotCategory.count(),
    subcategories: await prisma.subcategory.count(),
    auctions: await prisma.auction.count(),
    lots: await prisma.lot.count(),
    assets: await prisma.asset.count(),
    tenants: await prisma.tenant.count(),
    users: await prisma.user.count(),
  };
  console.log(JSON.stringify(counts, null, 2));
  console.log('\n=== DONE ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
