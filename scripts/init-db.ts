// scripts/init-db.ts
import { getDatabaseAdapter } from '@/lib/database';
import { sampleRoles, samplePlatformSettings, sampleLotCategories, sampleSubcategories, sampleStates, sampleCities, sampleCourts, sampleJudicialDistricts, sampleJudicialBranches } from '../src/lib/sample-data';

/**
 * This script initializes the database with essential, non-deletable data
 * required for the application to function correctly.
 * It seeds Roles, PlatformSettings, Categories, and Subcategories.
 * It's safe to run multiple times, as it uses `upsert` logic (or checks for existence).
 */
async function initializeDatabase() {
  console.log('Initializing database with essential data...');
  const db = getDatabaseAdapter();

  try {
    // Check for existing platform settings to determine if DB is already initialized.
    const settings = await db.getPlatformSettings();
    if (settings) {
        console.log("Essential data (Platform Settings) already exists. Skipping data population.");
        return;
    }
    
    console.log("No platform settings found. Populating essential data...");

    // Seed Roles
    console.log('Seeding Roles...');
    for (const role of sampleRoles) {
      // @ts-ignore
      await db.createRole(role);
    }
    console.log(`${sampleRoles.length} roles ensured.`);

    // Seed Platform Settings
    console.log('Seeding Platform Settings...');
    // @ts-ignore
    await db.updatePlatformSettings(samplePlatformSettings); // Using update as an upsert mechanism
    console.log('Global platform settings created.');
    
    // Seed States & Cities
    console.log('Seeding States...');
    for (const state of sampleStates) {
        // @ts-ignore
        await db.createState(state);
    }
    console.log(`${sampleStates.length} states ensured.`);
    
    console.log('Seeding Cities...');
    for (const city of sampleCities) {
        // @ts-ignore
        await db.createCity(city);
    }
    console.log(`${sampleCities.length} cities ensured.`);


    // Seed Categories
    console.log('Seeding Lot Categories...');
    for (const category of sampleLotCategories) {
        // @ts-ignore
        await db.createLotCategory(category);
    }
    console.log(`${sampleLotCategories.length} lot categories ensured.`);
    
    // Seed Subcategories
    console.log('Seeding Subcategories...');
    for (const subcategory of sampleSubcategories) {
        // @ts-ignore
        await db.createSubcategory(subcategory);
    }
    console.log(`${sampleSubcategories.length} subcategories ensured.`);
    
    // Seed Judicial Entities
    console.log('Seeding Judicial Entities...');
    for (const court of sampleCourts) {
        // @ts-ignore
        await db.createCourt(court);
    }
    for (const district of sampleJudicialDistricts) {
        // @ts-ignore
        await db.createJudicialDistrict(district);
    }
    for (const branch of sampleJudicialBranches) {
        // @ts-ignore
        await db.createJudicialBranch(branch);
    }
    console.log('Judicial entities ensured.');

    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  } finally {
    // @ts-ignore
    if(db.close) {
        // @ts-ignore
        await db.close();
        console.log('Database connection pool for script closed.');
    }
  }
}

initializeDatabase();