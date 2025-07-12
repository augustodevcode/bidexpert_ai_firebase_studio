
// src/scripts/init-db.ts
import { getDatabaseAdapter } from '@/lib/database/get-adapter';
import { samplePlatformSettings, sampleRoles, sampleLotCategories, sampleSubcategories, sampleCourts, getSampleStatesAndCities } from '@/lib/sample-data';
import type { Role, LotCategory, Subcategory, Court, StateInfo, CityInfo, CityFormData } from '@/types';

async function seedEssentialData() {
    console.log('\n--- [DB INIT - DML] Seeding Essential Data ---');
    const db = getDatabaseAdapter(); 
    
    try {
        // Platform Settings
        console.log('[DB INIT - DML] Seeding platform settings...');
        const settings = await db.getPlatformSettings();
        
        if (!settings || Object.keys(settings).length === 0 || !settings.id) {
            await db.createPlatformSettings(samplePlatformSettings);
            console.log("[DB INIT - DML] ✅ SUCCESS: Platform settings created.");
        } else {
            console.log("[DB INIT - DML] 🟡 INFO: Platform settings already exist.");
        }

        // Roles
        console.log("[DB INIT - DML] Seeding roles...");
        const existingRoles = await db.getRoles();
        const rolesToCreate = sampleRoles.filter((role: Role) => !existingRoles.some(er => er.name_normalized === role.name_normalized));
        for (const role of rolesToCreate) {
            await db.createRole(role);
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${rolesToCreate.length} new roles inserted.`);

        // Categories
        console.log("[DB INIT - DML] Seeding categories...");
        const existingCategories = await db.getLotCategories();
        const categoriesToCreate = sampleLotCategories.filter((cat: LotCategory) => !existingCategories.some(ec => ec.slug === cat.slug));
        for (const category of categoriesToCreate) {
            await db.createLotCategory(category);
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${categoriesToCreate.length} new categories inserted.`);
        
        // Subcategories
        console.log("[DB INIT - DML] Seeding subcategories...");
        // @ts-ignore
        const allSubcategories = await db.getSubcategoriesByParent ? await db.getSubcategoriesByParent() : [];
        const subcategoriesToCreate = sampleSubcategories.filter((sub: Subcategory) => !allSubcategories.some(es => es.slug === sub.slug && es.parentCategoryId === sub.parentCategoryId));
        for (const subcategory of subcategoriesToCreate) {
            await db.createSubcategory(subcategory);
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${subcategoriesToCreate.length} new subcategories inserted.`);
        
        const { states, cities } = getSampleStatesAndCities();

        // States
        console.log("[DB INIT - DML] Seeding states...");
        const existingStates = await db.getStates();
        const statesToCreate = states.filter((state: StateInfo) => !existingStates.some(es => es.uf === state.uf));
        for (const state of statesToCreate) {
             await db.createState(state);
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${statesToCreate.length} new states inserted.`);
        
        // Cities
        console.log("[DB INIT - DML] Seeding cities...");
        const existingCities = await db.getCities();
        const citiesToCreate = cities.filter((city: CityInfo) => !existingCities.some(ec => ec.slug === city.slug && ec.stateId === city.stateId));
        for (const city of citiesToCreate) {
             await db.createCity(city as CityFormData);
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${citiesToCreate.length} new cities inserted.`);

        // Courts
        console.log("[DB INIT - DML] Seeding courts...");
        const existingCourts = await db.getCourts();
        const courtsToCreate = sampleCourts.filter((court: Court) => !existingCourts.some(ec => ec.slug === court.slug));
        for (const court of courtsToCreate) {
            // @ts-ignore
            await db.createCourt(court);
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${courtsToCreate.length} new courts inserted.`);


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
