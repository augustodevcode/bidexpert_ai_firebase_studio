// src/scripts/init-db.ts
import { getDatabaseAdapter } from '@/lib/database/get-adapter';
import { samplePlatformSettings, sampleRoles, sampleLotCategories, sampleSubcategories, sampleCourts, sampleStates, sampleCities } from '@/lib/sample-data';
import type { DatabaseAdapter } from '@/types';


async function seedCollectionInBatches(db: DatabaseAdapter, collectionName: string, data: any[], existingItems: any[], uniqueKey: string) {
    console.log(`[DB INIT] Seeding ${collectionName}...`);
    const itemsToCreate = data.filter(item => !existingItems.some(existing => existing[uniqueKey] === item[uniqueKey]));
    
    // @ts-ignore - Assuming batchWrite exists on the adapter
    if (db.batchWrite && itemsToCreate.length > 0) {
        // @ts-ignore
        await db.batchWrite(collectionName, itemsToCreate);
    } else if (itemsToCreate.length > 0) {
        console.warn(`[DB INIT] batchWrite not found on adapter. Seeding ${collectionName} one by one.`);
        const createMethodName = `create${collectionName.charAt(0).toUpperCase() + collectionName.slice(1, -1)}`;
        const createMethod = (db as any)[createMethodName];
        if (createMethod) {
            for (const item of itemsToCreate) {
                await createMethod.call(db, item);
            }
        } else {
             console.warn(`[DB INIT] 🟡 WARNING: create method '${createMethodName}' not found on adapter.`);
        }
    }
    console.log(`[DB INIT] ✅ SUCCESS: ${itemsToCreate.length} new items processed for ${collectionName}.`);
}


async function seedEssentialData() {
    console.log('\n--- [DB INIT] Seeding Essential Data ---');
    const db = getDatabaseAdapter(); 
    
    try {
        // Platform Settings (Single Document)
        console.log('[DB INIT] Seeding platform settings...');
        const settings = await db.getPlatformSettings();
        if (!settings || Object.keys(settings).length === 0 || !settings.id) {
            await db.createPlatformSettings(samplePlatformSettings);
            console.log("[DB INIT] ✅ SUCCESS: Platform settings created.");
        } else {
            console.log("[DB INIT] 🟡 INFO: Platform settings already exist.");
        }

        // Batch-writable collections
        await seedCollectionInBatches(db, 'roles', sampleRoles, await db.getRoles(), 'name_normalized');
        await seedCollectionInBatches(db, 'lotCategories', sampleLotCategories, await db.getLotCategories(), 'slug');
        await seedCollectionInBatches(db, 'subcategories', sampleSubcategories, await db.getSubcategoriesByParent(), 'slug');
        await seedCollectionInBatches(db, 'states', sampleStates, await db.getStates(), 'uf');
        await seedCollectionInBatches(db, 'cities', sampleCities, await db.getCities(), 'slug');
        await seedCollectionInBatches(db, 'courts', sampleCourts, await db.getCourts(), 'slug');

    } catch (error: any) {
        console.error(`[DB INIT] ❌ ERROR seeding essential data: ${error.message}`);
    }
    
    console.log('--- [DB INIT] Essential Data seeding finished ---');
}


async function initializeDatabase() {
  console.log('🚀 [DB INIT] Starting database initialization script...');
  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'FIRESTORE';
  console.log(`[DB INIT] Active database system is configured to: ${activeSystem}`);

  await seedEssentialData();
  
  console.log("✅ [DB INIT] Initialization script finished.");
}

initializeDatabase().catch(error => {
    console.error("[DB INIT] ❌ FATAL ERROR during database initialization:", error);
    process.exit(1);
});
