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
  sampleUsers,
  sampleRoles,
  sampleLotCategories,
  sampleSubcategories,
  sampleStates,
  sampleCities,
  sampleCourts,
  sampleContactMessages,
  sampleDocumentTypes,
  sampleNotifications
} from '@/lib/sample-data';
import type { DatabaseAdapter } from '@/types';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

/**
 * Helper function to seed a collection in batches to avoid Firestore quota limits.
 */
async function seedCollectionInBatches(
    db: DatabaseAdapter, 
    collectionName: string, 
    data: any[], 
    uniqueKey: string,
    checkMethod: () => Promise<any[]>
) {
    console.log(`[DB SEED] Seeding ${collectionName}...`);
    
    const existingItems = await checkMethod();
    if (existingItems.length >= data.length) {
        console.log(`[DB SEED] 🟡 INFO: Collection ${collectionName} seems to be already seeded (${existingItems.length} items). Skipping.`);
        return;
    }
    
    // Filter out items that already exist based on a unique key
    const existingKeys = new Set(existingItems.map(item => item[uniqueKey]));
    const itemsToCreate = data.filter(item => !existingKeys.has(item[uniqueKey]));

    if (itemsToCreate.length === 0) {
        console.log(`[DB SEED] ✅ SUCCESS: No new items to add to ${collectionName}.`);
        return;
    }

    // @ts-ignore - Assuming batchWrite exists on the adapter
    if (db.batchWrite) {
        // @ts-ignore
        await db.batchWrite(collectionName, itemsToCreate);
        console.log(`[DB SEED] ✅ SUCCESS: ${itemsToCreate.length} new items processed for ${collectionName}.`);
    } else {
        console.warn(`[DB SEED] 🟡 WARNING: batchWrite not found on adapter. Seeding ${collectionName} one by one.`);
        for (const item of itemsToCreate) {
             // @ts-ignore
            await db[`create${collectionName.charAt(0).toUpperCase() + collectionName.slice(1, -1)}`](item);
        }
    }
}


async function seedFullData() {
    console.log('\n--- [DB SEED] Seeding Full Demo Data ---');
    const db = getDatabaseAdapter();

    try {
        await seedCollectionInBatches(db, 'states', sampleStates, 'uf', () => db.getStates());
        await seedCollectionInBatches(db, 'cities', sampleCities, 'slug', () => db.getCities());
        await seedCollectionInBatches(db, 'courts', sampleCourts, 'slug', () => db.getCourts());
        await seedCollectionInBatches(db, 'judicial_districts', sampleJudicialDistricts, 'slug', () => db.getJudicialDistricts());
        await seedCollectionInBatches(db, 'judicial_branches', sampleJudicialBranches, 'slug', () => db.getJudicialBranches());
        await seedCollectionInBatches(db, 'lot_categories', sampleLotCategories, 'slug', () => db.getLotCategories());
        await seedCollectionInBatches(db, 'subcategories', sampleSubcategories, 'slug', () => db.getSubcategoriesByParent());
        await seedCollectionInBatches(db, 'sellers', sampleSellers, 'slug', () => db.getSellers());
        await seedCollectionInBatches(db, 'auctioneers', sampleAuctioneers, 'slug', () => db.getAuctioneers());
        await seedCollectionInBatches(db, 'judicial_processes', sampleJudicialProcesses, 'processNumber', () => db.getJudicialProcesses());
        await seedCollectionInBatches(db, 'bens', sampleBens, 'publicId', () => db.getBens());
        await seedCollectionInBatches(db, 'auctions', sampleAuctions, 'publicId', () => db.getAuctions());
        await seedCollectionInBatches(db, 'lots', sampleLots, 'publicId', () => db.getLots());
        
        // Seeding users with password hashing
        console.log('[DB SEED] Seeding Users with Hashed Passwords...');
        const existingUsers = await db.getUsersWithRoles();
        const usersToCreate = sampleUsers.filter(u => !existingUsers.some(eu => eu.email === u.email));
        for (const user of usersToCreate) {
            const { password, ...userData } = user;
            const hashedPassword = await bcrypt.hash(password || 'password123', 10);
            const fullUserData = { ...userData, password: hashedPassword, uid: userData.uid || uuidv4() };
            const createResult = await db.createUser(fullUserData);
            // Link roles after user creation
            if (createResult.success && user.roleId && createResult.userId) {
                const roleIdsToLink = Array.isArray(user.roleId) ? user.roleId : [user.roleId];
                await db.updateUserRoles(createResult.userId, roleIdsToLink);
            }
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${usersToCreate.length} new users processed.`);

        // Single-item collections or collections without a simple unique key can be seeded individually if needed
        // For example, bids, wins, notifications etc. For now, we focus on the main entities.

    } catch (error: any) {
        console.error(`[DB SEED] ❌ ERROR seeding full demo data: ${error.message}`);
    }
    
    console.log('--- [DB SEED] Full Demo Data seeding finished ---');
}

seedFullData().catch(error => {
    console.error("[DB SEED] ❌ FATAL ERROR during seeding:", error);
    process.exit(1);
});
