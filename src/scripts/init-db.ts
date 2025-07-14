// src/scripts/init-db.ts
import { getDatabaseAdapter } from '@/lib/database/get-adapter';
import { samplePlatformSettings, sampleRoles, sampleLotCategories, sampleSubcategories, sampleCourts, sampleStates, sampleCities } from '@/lib/sample-data';
import type { DatabaseAdapter } from '@/types';


async function seedCollectionInBatches(db: DatabaseAdapter, collectionName: string, data: any[], existingItems: any[], uniqueKey: string) {
    console.log(`[DB INIT] LOG: Seeding ${collectionName}...`);
    const itemsToCreate = data.filter(item => !existingItems.some(existing => existing[uniqueKey] === item[uniqueKey]));
    
    // @ts-ignore - Assuming batchWrite exists on the adapter
    if (db.batchWrite && itemsToCreate.length > 0) {
        console.log(`[DB INIT] LOG: Using batchWrite for ${itemsToCreate.length} items.`);
        // @ts-ignore
        await db.batchWrite(collectionName, itemsToCreate);
    } else if (itemsToCreate.length > 0) {
        console.warn(`[DB INIT] LOG: batchWrite not found on adapter. Seeding ${collectionName} one by one.`);
        const createMethodName = `create${collectionName.charAt(0).toUpperCase() + collectionName.slice(1, -1)}`;
        // @ts-ignore
        const createMethod = db[createMethodName as keyof DatabaseAdapter];
        
        if (typeof createMethod === 'function') {
            for (const item of itemsToCreate) {
                try {
                    // @ts-ignore
                    const result = await createMethod.call(db, item);
                    if (!result.success) {
                        console.error(`[DB INIT] ❌ ERROR seeding item in ${collectionName} with key ${item[uniqueKey]}: ${result.message}`);
                    }
                } catch(e: any) {
                    console.error(`[DB INIT] ❌ CRITICAL ERROR seeding item in ${collectionName} with key ${item[uniqueKey]}:`, e.message);
                }
            }
        } else {
             console.warn(`[DB INIT] 🟡 WARNING: create method '${createMethodName}' not found on adapter.`);
        }
    }
    console.log(`[DB INIT] ✅ SUCCESS: ${itemsToCreate.length} new items processed for ${collectionName}.`);
}


async function seedEssentialData() {
    console.log('\n--- [DB INIT] LOG: Seeding Essential Data ---');
    const db = getDatabaseAdapter(); 
    
    try {
        // Platform Settings (Single Document)
        console.log('[DB INIT] LOG: Seeding platform settings...');
        const settings = await db.getPlatformSettings();
        if (!settings || Object.keys(settings).length === 0 || !settings.id) {
            await db.createPlatformSettings(samplePlatformSettings);
            console.log("[DB INIT] ✅ SUCCESS: Platform settings created.");
        } else {
            console.log("[DB INIT] 🟡 INFO: Platform settings already exist.");
        }

        // Batch-writable collections
        console.log("[DB INIT] LOG: Fetching existing data for essential collections.");
        const existingRoles = await db.getRoles();
        const existingCategories = await db.getLotCategories();
        const existingSubcategories = await db.getSubcategoriesByParent();
        const existingStates = await db.getStates();
        const existingCities = await db.getCities();
        const existingCourts = await db.getCourts();

        await seedCollectionInBatches(db, 'roles', sampleRoles, existingRoles, 'name_normalized');
        await seedCollectionInBatches(db, 'lotCategories', sampleLotCategories, existingCategories, 'slug');
        await seedCollectionInBatches(db, 'subcategories', sampleSubcategories, existingSubcategories, 'slug');
        await seedCollectionInBatches(db, 'states', sampleStates, existingStates, 'uf');
        await seedCollectionInBatches(db, 'cities', sampleCities, existingCities, 'slug');
        await seedCollectionInBatches(db, 'courts', sampleCourts, existingCourts, 'slug');

    } catch (error: any) {
        console.error(`[DB INIT] ❌ ERROR seeding essential data: ${error.message}`);
        throw error; // Throw error to stop the process if essential data fails
    }
    
    console.log('--- [DB INIT] LOG: Essential Data seeding finished ---');
}


async function initializeDatabase() {
  console.log('🚀 [DB INIT] LOG: Starting database initialization script...');
  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'FIRESTORE';
  console.log(`[DB INIT] LOG: Active database system is configured to: ${activeSystem}`);

  await seedEssentialData();
  
  console.log("✅ [DB INIT] LOG: Initialization script finished.");
}

initializeDatabase().catch(error => {
    console.error("[DB INIT] ❌ FATAL ERROR during database initialization:", error);
    process.exit(1);
});
