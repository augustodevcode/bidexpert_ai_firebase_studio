// src/scripts/init-db.ts
import { getDatabaseAdapter } from '@/lib/database/get-adapter';
import { samplePlatformSettings, sampleRoles } from '@/lib/sample-data';
import type { DatabaseAdapter } from '@/types';

/**
 * Seeds a specific collection if it doesn't already have data.
 * This is used for essential data required for the app to start.
 */
async function seedEssentialCollection(
  db: DatabaseAdapter, 
  collectionName: string, 
  data: any[], 
  checkMethod: () => Promise<any[]>,
  createMethodName: string
) {
    console.log(`[DB INIT - DML] Seeding ${collectionName}...`);
    const existingItems = await checkMethod();
    if (existingItems.length > 0) {
        console.log(`[DB INIT - DML] 🟡 INFO: Collection ${collectionName} already has data.`);
        return;
    }

    const createMethod = (db as any)[createMethodName];
    if (!createMethod) {
        console.warn(`[DB INIT - DML] 🟡 WARNING: create method '${createMethodName}' not found on adapter.`);
        return;
    }

    for (const item of data) {
        await createMethod.call(db, item);
    }
    console.log(`[DB INIT - DML] ✅ SUCCESS: ${data.length} items inserted into ${collectionName}.`);
}

/**
 * Seeds only the absolute minimum data required for the application to boot.
 * This prevents quota issues on first start and separates essential config from demo data.
 */
async function seedEssentialData() {
    console.log('\n--- [DB INIT - DML] Seeding Essential Data ---');
    const db = getDatabaseAdapter(); 
    
    try {
        // Platform Settings (Single Document - Critical for startup)
        console.log('[DB INIT - DML] Seeding platform settings...');
        const settings = await db.getPlatformSettings();
        if (!settings || Object.keys(settings).length === 0 || !settings.id) {
            await db.createPlatformSettings(samplePlatformSettings);
            console.log("[DB INIT - DML] ✅ SUCCESS: Platform settings created.");
        } else {
            console.log("[DB INIT - DML] 🟡 INFO: Platform settings already exist.");
        }

        // Roles (Essential for auth)
        await seedEssentialCollection(db, 'roles', sampleRoles, () => db.getRoles(), 'createRole');

    } catch (error: any) {
        console.error(`[DB INIT - DML] ❌ ERROR seeding essential data: ${error.message}`);
    }
    
    console.log('--- [DB INIT - DML] Essential Data seeding finished ---');
}


async function initializeDatabase() {
  console.log('🚀 [DB INIT] Starting database initialization script...');
  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'FIRESTORE';
  console.log(`[DB INIT] Active database system using Adapter pattern: ${activeSystem}`);

  await seedEssentialData();
  
  console.log("✅ [DB INIT] Initialization script finished.");
}

initializeDatabase().catch(error => {
    console.error("[DB INIT] ❌ FATAL ERROR during database initialization:", error);
    process.exit(1);
});
