
// scripts/init-db.ts
import { PrismaClient } from '@prisma/client';
import { sampleRoles, samplePlatformSettings, sampleLotCategories, sampleSubcategories } from '../src/lib/sample-data';

const prisma = new PrismaClient();

/**
 * This script initializes the database with essential, non-deletable data
 * required for the application to function correctly.
 * It seeds Roles, PlatformSettings, Categories, and Subcategories.
 * It's safe to run multiple times, as it uses `upsert` to avoid creating duplicates.
 */
async function initializeDatabase() {
  console.log('Initializing database with essential data...');

  try {
    // Seed Roles
    console.log('Checking and seeding Roles...');
    for (const role of sampleRoles) {
      await prisma.role.upsert({
        where: { id: role.id },
        update: { ...role, permissions: { set: role.permissions } }, // Ensure permissions are updated
        create: { ...role, permissions: { set: role.permissions } },
      });
    }
    console.log(`${sampleRoles.length} essential roles ensured.`);

    // Seed Platform Settings
    console.log('Checking and seeding Platform Settings...');
    const existingSettings = await prisma.platformSettings.findUnique({ where: { id: 'global' }});
    if (!existingSettings) {
        await prisma.platformSettings.create({
            data: {
              ...samplePlatformSettings,
              themes: samplePlatformSettings.themes ? { create: samplePlatformSettings.themes } : undefined,
              platformPublicIdMasks: samplePlatformSettings.platformPublicIdMasks ? { create: samplePlatformSettings.platformPublicIdMasks } : undefined,
              mapSettings: samplePlatformSettings.mapSettings ? { create: samplePlatformSettings.mapSettings } : undefined,
              biddingSettings: samplePlatformSettings.biddingSettings ? { create: samplePlatformSettings.biddingSettings } : undefined,
              mentalTriggerSettings: samplePlatformSettings.mentalTriggerSettings ? { create: samplePlatformSettings.mentalTriggerSettings } : undefined,
              sectionBadgeVisibility: samplePlatformSettings.sectionBadgeVisibility ? { create: samplePlatformSettings.sectionBadgeVisibility } : undefined,
              variableIncrementTable: samplePlatformSettings.variableIncrementTable ? { create: samplePlatformSettings.variableIncrementTable } : undefined,
            }
        });
        console.log('Global platform settings created.');
    } else {
        console.log('Platform settings already exist. Skipping.');
    }

    // Seed Categories
    console.log('Checking and seeding Lot Categories...');
    for (const category of sampleLotCategories) {
        await prisma.lotCategory.upsert({
            where: { id: category.id },
            update: { name: category.name, description: category.description, slug: category.slug },
            create: { ...category, hasSubcategories: sampleSubcategories.some(s => s.parentCategoryId === category.id) }
        });
    }
    console.log(`${sampleLotCategories.length} lot categories ensured.`);
    
    // Seed Subcategories
    console.log('Checking and seeding Subcategories...');
    for (const subcategory of sampleSubcategories) {
        await prisma.subcategory.upsert({
            where: { id: subcategory.id },
            update: { name: subcategory.name, slug: subcategory.slug, parentCategoryId: subcategory.parentCategoryId },
            create: subcategory,
        });
    }
    console.log(`${sampleSubcategories.length} subcategories ensured.`);


    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  }