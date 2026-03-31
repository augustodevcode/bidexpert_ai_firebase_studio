/**
 * @fileoverview Quick script to count records in all relevant tables.
 */
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const counts = {
    tenants: await p.tenant.count(),
    users: await p.user.count(),
    states: await p.state.count(),
    cities: await p.city.count(),
    courts: await p.court.count(),
    judicialDistricts: await p.judicialDistrict.count(),
    judicialBranches: await p.judicialBranch.count(),
    sellers: await p.seller.count(),
    auctioneers: await p.auctioneer.count(),
    categories: await p.lotCategory.count(),
    subcategories: await p.subcategory.count(),
    judicialProcesses: await p.judicialProcess.count(),
    assets: await p.asset.count(),
    auctions: await p.auction.count(),
    auctionStages: await p.auctionStage.count(),
    lots: await p.lot.count(),
    mediaItems: await p.mediaItem.count(),
    vehicleMakes: await p.vehicleMake.count(),
    vehicleModels: await p.vehicleModel.count(),
  };
  console.log(JSON.stringify(counts, null, 2));
  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
