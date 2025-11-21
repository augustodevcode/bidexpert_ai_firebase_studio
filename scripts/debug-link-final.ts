
import { PrismaClient } from '@prisma/client';
import { lotService } from '../src/services/lot.service';
import { AuctionService } from '../src/services/auction.service';

const prisma = new PrismaClient();
const auctionService = new AuctionService();

async function main() {
    const auctionIdParam = 'auction-sp-equip-1763656353596';
    const lotIdParam = 'lot-1763656387095-0.12093677018375026';

    console.log('--- DEBUGGING LINK ISSUE ---');
    console.log(`Auction Param: ${auctionIdParam}`);
    console.log(`Lot Param: ${lotIdParam}`);

    // 1. Fetch Auction
    console.log('\n1. Fetching Auction...');
    const auction = await auctionService.getAuctionById(undefined, auctionIdParam, true);
    if (!auction) {
        console.error('❌ Auction NOT FOUND!');
    } else {
        console.log('✅ Auction Found:');
        console.log(`   ID: ${auction.id} (Type: ${typeof auction.id})`);
        console.log(`   PublicID: ${auction.publicId}`);
        console.log(`   Title: ${auction.title}`);
    }

    // 2. Fetch Lot
    console.log('\n2. Fetching Lot...');
    // Note: We use findLotById directly to test the service logic we fixed
    const lot = await lotService.getLotById(lotIdParam, undefined, true);

    if (!lot) {
        console.error('❌ Lot NOT FOUND!');
    } else {
        console.log('✅ Lot Found:');
        console.log(`   ID: ${lot.id} (Type: ${typeof lot.id})`);
        console.log(`   PublicID: ${lot.publicId}`);
        console.log(`   AuctionID: ${lot.auctionId} (Type: ${typeof lot.auctionId})`);
        console.log(`   Title: ${lot.title}`);
    }

    // 3. Compare
    if (auction && lot) {
        console.log('\n3. Comparing IDs...');
        console.log(`   Lot.auctionId (${lot.auctionId}) === Auction.id (${auction.id}) ?`);
        
        if (lot.auctionId === auction.id) {
             console.log('✅ MATCH! The IDs match.');
        } else {
             console.log('❌ MISMATCH! The IDs do NOT match.');
             console.log(`   Difference: '${lot.auctionId}' vs '${auction.id}'`);
        }
    }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
