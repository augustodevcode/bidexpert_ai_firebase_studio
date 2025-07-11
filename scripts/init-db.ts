// scripts/init-db.ts
import { PrismaClient } from '@prisma/client';
import { sampleRoles, samplePlatformSettings } from '../src/lib/sample-data';

const prisma = new PrismaClient();

/**
 * This script initializes the database with essential, non-deletable data
 * required for the application to function correctly.
 * It seeds Roles and PlatformSettings.
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
    const settingsData = {
      ...samplePlatformSettings,
      // Prisma requires nested objects to be created explicitly
      themes: samplePlatformSettings.themes ? { create: samplePlatformSettings.themes } : undefined,
      platformPublicIdMasks: samplePlatformSettings.platformPublicIdMasks ? { create: samplePlatformSettings.platformPublicIdMasks } : undefined,
      mapSettings: samplePlatformSettings.mapSettings ? { create: samplePlatformSettings.mapSettings } : undefined,
      biddingSettings: samplePlatformSettings.biddingSettings ? { create: samplePlatformSettings.biddingSettings } : undefined,
      mentalTriggerSettings: samplePlatformSettings.mentalTriggerSettings ? { create: samplePlatformSettings.mentalTriggerSettings } : undefined,
      sectionBadgeVisibility: samplePlatformSettings.sectionBadgeVisibility ? { create: samplePlatformSettings.sectionBadgeVisibility } : undefined,
      variableIncrementTable: samplePlatformSettings.variableIncrementTable ? { create: samplePlatformSettings.variableIncrementTable } : undefined,
    };
    
    // Use raw query to check for existence and then upsert to handle potential JSON issues with Prisma Client < 5
    const existingSettings = await prisma.platformSettings.findUnique({ where: { id: 'global' }});
    if (existingSettings) {
        console.log('Platform settings already exist. Skipping creation.');
    } else {
         await prisma.platformSettings.create({ data: settingsData });
         console.log('Global platform settings created.');
    }


    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initializeDatabase();
