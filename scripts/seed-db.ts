// scripts/seed-db.ts
import { getDatabaseAdapter } from '@/lib/database/get-adapter';
import { 
  sampleSellers, 
  sampleAuctioneers, 
  sampleJudicialDistricts, 
  sampleJudicialBranches,
  sampleJudicialProcesses,
  sampleAuctions,
  sampleLots,
  sampleBens,
  sampleDirectSaleOffers,
  sampleBids,
  sampleUserWins,
  sampleUsers
} from '@/lib/sample-data';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

async function seedFullData() {
    console.log('\n--- [DB SEED] Seeding Full Demo Data ---');
    const db = getDatabaseAdapter();

    try {
        console.log('[DB SEED] Seeding Sellers...');
        for (const seller of sampleSellers) {
            await db.createSeller(seller);
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleSellers.length} sellers processed.`);

        console.log('[DB SEED] Seeding Auctioneers...');
        for (const auctioneer of sampleAuctioneers) {
            await db.createAuctioneer(auctioneer);
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleAuctioneers.length} auctioneers processed.`);
        
        console.log('[DB SEED] Seeding Judicial Districts...');
        for (const district of sampleJudicialDistricts) {
             await db.createJudicialDistrict(district);
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleJudicialDistricts.length} judicial districts processed.`);
        
        console.log('[DB SEED] Seeding Judicial Branches...');
        for (const branch of sampleJudicialBranches) {
            await db.createJudicialBranch(branch);
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleJudicialBranches.length} judicial branches processed.`);
        
        console.log('[DB SEED] Seeding Judicial Processes...');
        for (const process of sampleJudicialProcesses) {
            await db.createJudicialProcess(process);
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleJudicialProcesses.length} judicial processes processed.`);

        console.log('[DB SEED] Seeding Bens...');
        for (const bem of sampleBens) {
            await db.createBem(bem);
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleBens.length} bens processed.`);
        
        console.log('[DB SEED] Seeding Auctions...');
        for (const auction of sampleAuctions) {
            await db.createAuction(auction);
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleAuctions.length} auctions processed.`);

        console.log('[DB SEED] Seeding Lots...');
        for (const lot of sampleLots) {
            await db.createLot(lot);
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleLots.length} lots processed.`);
        
        console.log('[DB SEED] Seeding Direct Sale Offers...');
        const offerAdapter = db as any;
        if (offerAdapter.createDirectSaleOffer) {
            for (const offer of sampleDirectSaleOffers) {
                await offerAdapter.createDirectSaleOffer(offer);
            }
            console.log(`[DB SEED] ✅ SUCCESS: ${sampleDirectSaleOffers.length} direct sale offers processed.`);
        } else {
            console.log(`[DB SEED] 🟡 INFO: createDirectSaleOffer not implemented on this adapter.`);
        }

        console.log('[DB SEED] Seeding Bids...');
        const bidAdapter = db as any;
        if (bidAdapter.createBid) {
            for (const bid of sampleBids) {
                await bidAdapter.createBid(bid);
            }
            console.log(`[DB SEED] ✅ SUCCESS: ${sampleBids.length} bids processed.`);
        } else {
             console.log(`[DB SEED] 🟡 INFO: createBid not implemented on this adapter.`);
        }
        
        console.log('[DB SEED] Seeding User Wins...');
        const winAdapter = db as any;
        if (winAdapter.createUserWin) {
            for (const win of sampleUserWins) {
                await winAdapter.createUserWin(win);
            }
            console.log(`[DB SEED] ✅ SUCCESS: ${sampleUserWins.length} wins processed.`);
        } else {
             console.log(`[DB SEED] 🟡 INFO: createUserWin not implemented on this adapter.`);
        }

        console.log('[DB SEED] Seeding Users with Hashed Passwords...');
        const userAdapter = db as any;
        if (userAdapter.createUser) {
            const existingUsers = await db.getUsersWithRoles();
            const usersToCreate = sampleUsers.filter(u => !existingUsers.some(eu => eu.email === u.email));
            for (const user of usersToCreate) {
                const { password, ...userData } = user;
                const hashedPassword = await bcrypt.hash(password, 10);
                const fullUserData = { ...userData, password: hashedPassword, uid: uuidv4() };
                await userAdapter.createUser(fullUserData);
            }
            console.log(`[DB SEED] ✅ SUCCESS: ${usersToCreate.length} new users processed.`);
        } else {
             console.log(`[DB SEED] 🟡 INFO: createUser not implemented on this adapter.`);
        }

    } catch (error: any) {
        console.error(`[DB SEED] ❌ ERROR seeding full demo data: ${error.message}`);
    }
    
    console.log('--- [DB SEED] Full Demo Data seeding finished ---');
}

seedFullData().catch(error => {
    console.error("[DB SEED] ❌ FATAL ERROR during seeding:", error);
    process.exit(1);
});
