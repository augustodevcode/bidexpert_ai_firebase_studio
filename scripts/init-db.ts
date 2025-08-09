// src/scripts/init-db.ts
import { prisma } from '@/lib/prisma';
import { 
    samplePlatformSettings, 
    sampleRoles, 
    sampleLotCategories, 
    sampleSubcategories, 
    sampleCourts, 
    sampleStates, 
    sampleCities
} from '@/lib/sample-data';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';


async function seedEssentialData() {
    console.log('\n--- [DB INIT] LOG: Seeding Essential Data ---');
    
    // Platform Settings (Single Document)
    console.log('[DB INIT] LOG: Seeding platform settings...');
    await prisma.platformSettings.upsert({
        where: { id: 'global' },
        update: {},
        create: { ...samplePlatformSettings, id: 'global' } as any
    });
    console.log('[DB INIT] ✅ SUCCESS: Platform settings verified/created.');

    // Seeding Roles
    console.log('[DB INIT] LOG: Seeding roles...');
    for (const roleData of sampleRoles) {
        await prisma.role.upsert({
            where: { nameNormalized: roleData.nameNormalized },
            update: { name: roleData.name, description: roleData.description, permissions: roleData.permissions as any },
            create: roleData as any
        });
    }
    console.log(`[DB INIT] ✅ SUCCESS: Roles verified/created.`);

    // Seeding Lot Categories
    console.log('[DB INIT] LOG: Seeding Lot Categories...');
     for (const catData of sampleLotCategories) {
        await prisma.lotCategory.upsert({
            where: { slug: catData.slug },
            update: { name: catData.name, hasSubcategories: catData.hasSubcategories },
            create: catData as any
        });
    }
    console.log(`[DB INIT] ✅ SUCCESS: Categories verified/created.`);
    
    // Seeding Subcategories
    console.log('[DB INIT] LOG: Seeding Subcategories...');
     for (const subCatData of sampleSubcategories) {
        await prisma.subcategory.upsert({
            where: { slug: subCatData.slug },
            update: { name: subCatData.name, parentCategoryId: subCatData.parentCategoryId },
            create: subCatData as any
        });
    }
    console.log(`[DB INIT] ✅ SUCCESS: Subcategories verified/created.`);

    // Seeding States
    console.log('[DB INIT] LOG: Seeding States...');
    await Promise.all(sampleStates.map(state => 
        prisma.state.upsert({
            where: { uf: state.uf },
            update: {},
            create: state
        })
    ));
    console.log(`[DB INIT] ✅ SUCCESS: States verified/created.`);

    // Seeding Cities
    console.log('[DB INIT] LOG: Seeding Cities...');
    const allStates = await prisma.state.findMany(); // Re-fetch to ensure we have IDs
    let newCitiesCount = 0;
    for (const cityData of sampleCities) {
        const parentState = allStates.find(s => s.uf === cityData.stateUf);
        if (!parentState) {
            console.error(`[DB INIT] ⚠️ WARNING: State with UF "${cityData.stateUf}" not found for city "${cityData.name}". Skipping.`);
            continue;
        }
        const existingCity = await prisma.city.findUnique({ where: { ibgeCode: cityData.ibgeCode } });
        if (!existingCity) {
            await prisma.city.create({ 
                data: {
                    name: cityData.name,
                    slug: cityData.slug,
                    stateId: parentState.id,
                    stateUf: cityData.stateUf,
                    ibgeCode: cityData.ibgeCode,
                }
            });
            newCitiesCount++;
        }
    }
    console.log(`[DB INIT] ✅ SUCCESS: Processed ${sampleCities.length} cities, ${newCitiesCount} new cities created.`);
    
    // Seeding Courts
    console.log('[DB INIT] LOG: Seeding Courts...');
    for (const courtData of sampleCourts) {
        await prisma.court.upsert({
            where: { id: courtData.id },
            update: {},
            create: courtData as any,
        });
    }
    console.log(`[DB INIT] ✅ SUCCESS: Courts verified/created.`);

    console.log('--- [DB INIT] LOG: Essential Data seeding finished ---');
}


async function initializeDatabase() {
  console.log('🚀 [DB INIT] LOG: Starting database initialization script...');
  try {
    await seedEssentialData();
    console.log("✅ [DB INIT] LOG: Initialization script finished.");
  } catch (error: any) {
    console.error("[DB INIT] ❌ FATAL SCRIPT ERROR during database initialization:", error);
    // Exit with an error code to stop the server from starting if init fails
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initializeDatabase();
