
// scripts/seed-db.ts
import { getDatabaseAdapter } from '@/lib/database/index';
import { 
  sampleSellers, 
  sampleAuctioneers, 
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
    console.log('\n--- [DB SEED] LOG: Seeding Full Demo Data ---');
    const db = getDatabaseAdapter();

    try {
        console.log('[DB SEED] LOG: Seeding Sellers...');
        for (const seller of sampleSellers) {
            // @ts-ignore
            await db.createSeller(seller);
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleSellers.length} sellers processed.`);

        console.log('[DB SEED] LOG: Seeding Auctioneers...');
        for (const auctioneer of sampleAuctioneers) {
            // @ts-ignore
            await db.createAuctioneer(auctioneer);
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleAuctioneers.length} auctioneers processed.`);
        
        console.log('[DB SEED] LOG: Seeding Judicial Processes...');
        for (const process of sampleJudicialProcesses) {
            // @ts-ignore
            await db.createJudicialProcess(process);
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleJudicialProcesses.length} judicial processes processed.`);

        console.log('[DB SEED] LOG: Seeding Bens...');
        for (const bem of sampleBens) {
            // @ts-ignore
            await db.createBem(bem);
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleBens.length} bens processed.`);
        
        console.log('[DB SEED] LOG: Seeding Auctions...');
        for (const auction of sampleAuctions) {
            await db.createAuction(auction);
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleAuctions.length} auctions processed.`);

        console.log('[DB SEED] LOG: Seeding Lots...');
        for (const lot of sampleLots) {
            await db.createLot(lot);
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleLots.length} lots processed.`);
        
        console.log('[DB SEED] LOG: Seeding Direct Sale Offers...');
        const offerAdapter = db as any;
        if (offerAdapter.createDirectSaleOffer) {
            for (const offer of sampleDirectSaleOffers) {
                await offerAdapter.createDirectSaleOffer(offer);
            }
            console.log(`[DB SEED] ✅ SUCCESS: ${sampleDirectSaleOffers.length} direct sale offers processed.`);
        } else {
            console.log(`[DB SEED] 🟡 INFO: createDirectSaleOffer not implemented on this adapter.`);
        }

        console.log('[DB SEED] LOG: Seeding Bids...');
        const bidAdapter = db as any;
        if (bidAdapter.createBid) {
            for (const bid of sampleBids) {
                await bidAdapter.createBid(bid);
            }
            console.log(`[DB SEED] ✅ SUCCESS: ${sampleBids.length} bids processed.`);
        } else {
             console.log(`[DB SEED] 🟡 INFO: createBid not implemented on this adapter.`);
        }
        
        console.log('[DB SEED] LOG: Seeding User Wins...');
        const winAdapter = db as any;
        if (winAdapter.createUserWin) {
            for (const win of sampleUserWins) {
                await winAdapter.createUserWin(win);
            }
            console.log(`[DB SEED] ✅ SUCCESS: ${sampleUserWins.length} wins processed.`);
        } else {
             console.log(`[DB SEED] 🟡 INFO: createUserWin not implemented on this adapter.`);
        }

        console.log('[DB SEED] LOG: Seeding Additional Users...');
        const userAdapter = db as any;
        if (userAdapter.createUser) {
            const existingUsers = await db.getUsersWithRoles();
            const usersToCreate = sampleUsers.filter(u => !existingUsers.some(eu => eu.email === u.email));
            
            console.log(`[DB SEED] LOG: ${usersToCreate.length} new users to be created in Firestore.`);
            
            for (const user of usersToCreate) {
                // We assume Auth user is created by init script or already exists.
                // This script only seeds the Firestore document.
                const { password, ...userData } = user;
                const fullUserData = { ...userData, uid: userData.uid || uuidv4() };
                await userAdapter.createUser(fullUserData);

                if (user.roleIds) {
                    await userAdapter.updateUserRoles(fullUserData.uid, user.roleIds);
                }
            }
            console.log(`[DB SEED] ✅ SUCCESS: ${usersToCreate.length} new user documents created.`);
        } else {
             console.log(`[DB SEED] 🟡 INFO: createUser not implemented on this adapter.`);
        }

        // Final step: Mark setup as complete
        console.log('[DB SEED] LOG: Marking setup as complete...');
        // @ts-ignore
        if (db.updateSystemInfo) {
            // @ts-ignore
            await db.updateSystemInfo('global', { isSetupComplete: true });
        } else {
            await db.updatePlatformSettings({ isSetupComplete: true });
        }
        console.log('[DB SEED] ✅ SUCCESS: Setup marked as complete.');


    } catch (error: any) {
        console.error(`[DB SEED] ❌ ERROR seeding full demo data: ${error.message}`);
        console.error("Stack Trace:", error.stack);
    }
    
    console.log('--- [DB SEED] LOG: Full Demo Data seeding finished ---');
}

seedFullData().catch(error => {
    console.error("[DB SEED] 