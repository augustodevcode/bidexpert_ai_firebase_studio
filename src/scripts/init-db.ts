// src/scripts/init-db.ts
import dotenv from 'dotenv';
import path from 'path';
import { getDatabaseAdapter } from '@/lib/database'; 
import { samplePlatformSettings, sampleRoles, sampleLotCategories, sampleSubcategories } from '@/lib/sample-data';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: false });


async function seedEssentialData() {
    console.log('\n--- [DB INIT - DML] Seeding Essential Data ---');
    const db = getDatabaseAdapter(); 
    
    try {
        // Platform Settings
        console.log('[DB INIT - DML] Seeding platform settings...');
        // @ts-ignore
        const settings = await db.getPlatformSettings ? await db.getPlatformSettings() : null;
        
        if (!settings || Object.keys(settings).length === 0 || !settings.id) {
            // @ts-ignore
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
            // @ts-ignore
            await db.createRole(role);
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${rolesToCreate.length} new roles inserted.`);

        // Categories
        console.log("[DB INIT - DML] Seeding categories...");
        const existingCategories = await db.getLotCategories();
        const categoriesToCreate = sampleLotCategories.filter(cat => !existingCategories.some(ec => ec.slug === cat.slug));
        for (const category of categoriesToCreate) {
            // @ts-ignore
            await db.createLotCategory(category);
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${categoriesToCreate.length} new categories inserted.`);
        
        // Subcategories
        console.log("[DB INIT - DML] Seeding subcategories...");
        // @ts-ignore
        const allSubcategories = await db.getSubcategoriesByParent();
        const subcategoriesToCreate = sampleSubcategories.filter(sub => !allSubcategories.some(es => es.slug === sub.slug && es.parentCategoryId === sub.parentCategoryId));
        for (const subcategory of subcategoriesToCreate) {
            // @ts-ignore
            await db.createSubcategory(subcategory);
        }
        console.log(`[DB INIT - DML] ✅ SUCCESS: ${subcategoriesToCreate.length} new subcategories inserted.`);

    } catch (error: any) {
        console.error(`[DB INIT - DML] ❌ ERROR seeding essential data: ${error.message}`);
        // Do not re-throw, allow the process to continue if possible, but log the error.
    }
    
    console.log('--- [DB INIT - DML] Essential Data seeding finished ---');
}


async function initializeDatabase() {
  console.log('🚀 [DB INIT] Starting database initialization script...');
  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM;
  console.log(`[DB INIT] Active database system: ${activeSystem}`);

  // This script is only meant for SQL-based adapters that need table creation.
  if (activeSystem !== 'MYSQL' && activeSystem !== 'POSTGRES') {
      console.log(`[DB INIT] 🟡 Skipping SQL schema initialization for system: ${activeSystem}. Seeding may still occur if adapter supports it.`);
      // Even if not SQL, we might want to seed essentials if the adapter supports it (e.g., Firestore)
      await seedEssentialData();
      return;
  }
  
  const dbUrl = activeSystem === 'MYSQL' ? process.env.DATABASE_URL : process.env.POSTGRES_DATABASE_URL;
  if (!dbUrl) {
      console.error(`[DB INIT] ❌ ERROR: Database URL for ${activeSystem} is not configured.`);
      process.exit(1);
  }

  // Seeding essential data is now part of the main flow for all adapters
  await seedEssentialData();
  
  console.log("✅ [DB INIT] Initialization script finished.");
}

initializeDatabase().catch(error => {
    console.error("[DB INIT] ❌ FATAL ERROR during database initialization:", error);
    process.exit(1);
});
