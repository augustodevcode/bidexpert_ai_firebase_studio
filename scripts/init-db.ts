// src/scripts/init-db.ts
import { getDatabaseAdapter } from '@/lib/database/get-adapter';
import { samplePlatformSettings, sampleRoles, sampleLotCategories, sampleSubcategories, sampleCourts, sampleStates, sampleCities } from '@/lib/sample-data';
import type { Role, LotCategory, Subcategory, Court, StateInfo, CityInfo, CityFormData } from '@/types';
import type { MySqlAdapter } from '@/lib/database/mysql.adapter';

async function seedEssentialData() {
    console.log('\n--- [DB INIT - DML] Seeding Essential Data ---');
    const db = getDatabaseAdapter(); 
    
    try {
        // Platform Settings
        console.log('[DB INIT - DML] Seeding platform settings...');
        await db.createPlatformSettings(samplePlatformSettings);
        console.log("[DB INIT - DML] ✅ SUCCESS: Platform settings created.");

        // Roles
        console.log("[DB INIT - DML] Seeding roles...");
        for (const role of sampleRoles) {
            await db.createRole(role);
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${sampleRoles.length} new roles inserted.`);

        // Categories
        console.log("[DB INIT - DML] Seeding categories...");
        for (const category of sampleLotCategories) {
            await db.createLotCategory(category);
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${sampleLotCategories.length} new categories inserted.`);
        
        // Subcategories
        console.log("[DB INIT - DML] Seeding subcategories...");
        for (const subcategory of sampleSubcategories) {
            await db.createSubcategory(subcategory);
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${sampleSubcategories.length} new subcategories inserted.`);
        
        // States
        console.log("[DB INIT - DML] Seeding states...");
        for (const state of sampleStates) {
             await db.createState(state);
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${sampleStates.length} new states inserted.`);
        
        // Cities
        console.log("[DB INIT - DML] Seeding cities...");
        for (const city of sampleCities) {
            await db.createCity(city as CityFormData);
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${sampleCities.length} new cities processed.`);

        // Courts
        console.log("[DB INIT - DML] Seeding courts...");
        for (const court of sampleCourts) {
            // @ts-ignore
            await db.createCourt(court);
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${sampleCourts.length} new courts inserted.`);


    } catch (error: any) {
        console.error(`[DB INIT - DML] ❌ ERROR seeding essential data: ${error.message}`);
    }
    
    console.log('--- [DB INIT - DML] Essential Data seeding finished ---');
}


async function initializeDatabase() {
  console.log('🚀 [DB INIT] Starting database initialization script...');
  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA';
  console.log(`[DB INIT] Active database system using Adapter pattern: ${activeSystem}`);

  await seedEssentialData();
  
  console.log("✅ [DB INIT] Initialization script finished.");
}

initializeDatabase().catch(error => {
    console.error("[DB INIT] ❌ FATAL ERROR during database initialization:", error);
    process.exit(1);
});
