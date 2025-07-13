// src/scripts/init-db.ts
import { getDatabaseAdapter } from '@/lib/database/get-adapter';
import { samplePlatformSettings, sampleRoles, sampleLotCategories, sampleSubcategories, sampleCourts, sampleStates, sampleCities } from '@/lib/sample-data';

async function seedEssentialData() {
    console.log('\n--- [DB INIT] Seeding Essential Data ---');
    const db = getDatabaseAdapter(); 
    
    try {
        // Platform Settings
        console.log('[DB INIT] Seeding platform settings...');
        const settings = await db.getPlatformSettings();
        
        if (!settings || !settings.id) {
            await db.createPlatformSettings(samplePlatformSettings);
            console.log("[DB INIT] ✅ SUCCESS: Platform settings created.");
        } else {
            console.log("[DB INIT] 🟡 INFO: Platform settings already exist.");
        }

        // Roles
        console.log("[DB INIT] Seeding roles...");
        const existingRoles = await db.getRoles();
        const rolesToCreate = sampleRoles.filter(role => !existingRoles.some(er => er.id === role.id));
        for (const role of rolesToCreate) {
            await db.createRole(role);
        }
        console.log(`[DB INIT] ✅ SUCCESS: ${rolesToCreate.length} new roles inserted.`);

        // Categories
        console.log("[DB INIT] Seeding categories...");
        const existingCategories = await db.getLotCategories();
        const categoriesToCreate = sampleLotCategories.filter(cat => !existingCategories.some(ec => ec.slug === cat.slug));
        for (const category of categoriesToCreate) {
            await db.createLotCategory(category);
        }
        console.log(`[DB INIT] ✅ SUCCESS: ${categoriesToCreate.length} new categories inserted.`);
        
        // Subcategories
        console.log("[DB INIT] Seeding subcategories...");
        // @ts-ignore
        const allSubcategories = await db.getSubcategoriesByParent ? await db.getSubcategoriesByParent() : [];
        const subcategoriesToCreate = sampleSubcategories.filter(sub => !allSubcategories.some((es: any) => es.slug === sub.slug && es.parentCategoryId === sub.parentCategoryId));
        for (const subcategory of subcategoriesToCreate) {
            // @ts-ignore
            await db.createSubcategory(subcategory);
        }
        console.log(`[DB INIT] ✅ SUCCESS: ${subcategoriesToCreate.length} new subcategories inserted.`);
        
        // States
        console.log("[DB INIT] Seeding states...");
        const existingStates = await db.getStates();
        const statesToCreate = sampleStates.filter(state => !existingStates.some(es => es.uf === state.uf));
        for (const state of statesToCreate) {
             // @ts-ignore
             await db.createState(state);
        }
        console.log(`[DB INIT] ✅ SUCCESS: ${statesToCreate.length} new states inserted.`);
        
        // Cities
        console.log("[DB INIT] Seeding cities...");
        const existingCities = await db.getCities();
        const citiesToCreate = sampleCities.filter(city => !existingCities.some((ec: any) => ec.slug === city.slug && ec.stateUf === city.stateUf));
        for (const city of citiesToCreate) {
             // @ts-ignore
             await db.createCity(city);
        }
        console.log(`[DB INIT] ✅ SUCCESS: ${citiesToCreate.length} new cities inserted.`);

        // Courts
        console.log("[DB INIT] Seeding courts...");
        const existingCourts = await db.getCourts();
        const courtsToCreate = sampleCourts.filter(court => !existingCourts.some(ec => ec.slug === court.slug));
        for (const court of courtsToCreate) {
            // @ts-ignore
            await db.createCourt(court);
        }
        console.log(`[DB INIT] ✅ SUCCESS: ${courtsToCreate.length} new courts inserted.`);


    } catch (error: any) {
        console.error(`[DB INIT] ❌ ERROR seeding essential data: ${error.message}`);
        // Em caso de erro, talvez não queiramos sair do processo em dev,
        // mas é importante registrar o erro.
        // process.exit(1); 
    }
    
    console.log('--- [DB INIT] Essential Data seeding finished ---');
}


async function initializeDatabase() {
  console.log('🚀 [DB INIT] Starting database initialization script...');
  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'FIRESTORE';
  console.log(`[DB INIT] Active database system is configured to: ${activeSystem}`);

  if (activeSystem !== 'FIRESTORE') {
    console.warn(`[DB INIT] WARNING: Database system is not Firestore. The application is optimized for Firestore. Skipping Firestore seeding.`);
    return;
  }
  
  await seedEssentialData();
  
  console.log("✅ [DB INIT] Initialization script finished.");
}

initializeDatabase().catch(error => {
    console.error("[DB INIT] ❌ FATAL ERROR during database initialization:", error);
    process.exit(1);
});
