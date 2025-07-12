// src/scripts/init-db.ts
import { getDatabaseAdapter } from '@/lib/database/get-adapter';
import { samplePlatformSettings, sampleRoles, sampleLotCategories, sampleSubcategories } from '@/lib/sample-data';

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
        const rolesToCreate = sampleRoles.filter(role => !existingRoles.some(er => er.name_normalized === role.name_normalized));
        for (const role of rolesToCreate) {
            await db.createRole(role);
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${rolesToCreate.length} new roles inserted.`);

        // Categories
        console.log("[DB INIT - DML] Seeding categories...");
        const existingCategories = await db.getLotCategories();
        const categoriesToCreate = sampleLotCategories.filter(cat => !existingCategories.some(ec => ec.slug === cat.slug));
        for (const category of categoriesToCreate) {
            await db.createLotCategory(category);
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${categoriesToCreate.length} new categories inserted.`);
        
        // Subcategories
        console.log("[DB INIT - DML] Seeding subcategories...");
        // @ts-ignore
        const allSubcategories = await db.getSubcategoriesByParent ? await db.getSubcategoriesByParent() : [];
        const subcategoriesToCreate = sampleSubcategories.filter(sub => !allSubcategories.some(es => es.slug === sub.slug && es.parentCategoryId === sub.parentCategoryId));
        for (const subcategory of subcategoriesToCreate) {
            await db.createSubcategory(subcategory);
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${subcategoriesToCreate.length} new subcategories inserted.`);

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
