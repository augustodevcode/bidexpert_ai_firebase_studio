
// src/scripts/init-db.ts
import { prisma } from '@/lib/prisma';
import { 
    samplePlatformSettings, 
    sampleRoles, 
    sampleLotCategories, 
    sampleSubcategories, 
    sampleCourts, 
    sampleStates, 
    sampleCities,
    sampleUsers
} from '@/lib/sample-data';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';


async function seedEssentialData() {
    console.log('\n--- [DB INIT] LOG: Seeding Essential Data ---');
    
    try {
        // Platform Settings (Single Document)
        console.log('[DB INIT] LOG: Seeding platform settings...');
        const settingsCount = await prisma.platformSettings.count();
        if (settingsCount === 0) {
            // @ts-ignore
            await prisma.platformSettings.create({ data: samplePlatformSettings });
            console.log("[DB INIT] ✅ SUCCESS: Platform settings created.");
        } else {
            console.log("[DB INIT] 🟡 INFO: Platform settings already exist.");
        }

        // Seeding Roles
        console.log('[DB INIT] LOG: Seeding roles...');
        const existingRoles = await prisma.role.findMany({ select: { id: true }});
        const existingRoleIds = new Set(existingRoles.map(r => r.id));
        const rolesToCreate = sampleRoles.filter(role => !existingRoleIds.has(role.id));
        if (rolesToCreate.length > 0) {
            // @ts-ignore
            await prisma.role.createMany({ data: rolesToCreate, skipDuplicates: true });
            console.log(`[DB INIT] ✅ SUCCESS: ${rolesToCreate.length} new roles created.`);
        } else {
            console.log("[DB INIT] 🟡 INFO: Roles already exist.");
        }

        // Seeding Lot Categories
        console.log('[DB INIT] LOG: Seeding Lot Categories...');
        const existingCats = await prisma.lotCategory.findMany({ select: { id: true }});
        const existingCatIds = new Set(existingCats.map(c => c.id));
        const catsToCreate = sampleLotCategories.filter(cat => !existingCatIds.has(cat.id));
        if (catsToCreate.length > 0) {
             // @ts-ignore
            await prisma.lotCategory.createMany({ data: catsToCreate, skipDuplicates: true });
            console.log(`[DB INIT] ✅ SUCCESS: ${catsToCreate.length} new categories created.`);
        } else {
            console.log("[DB INIT] 🟡 INFO: Categories already exist.");
        }
        
        // Seeding Subcategories
        console.log('[DB INIT] LOG: Seeding Subcategories...');
        const existingSubCats = await prisma.subcategory.findMany({ select: { id: true }});
        const existingSubCatIds = new Set(existingSubCats.map(s => s.id));
        const subCatsToCreate = sampleSubcategories.filter(sub => !existingSubCatIds.has(sub.id));
        if (subCatsToCreate.length > 0) {
            // @ts-ignore
            await prisma.subcategory.createMany({ data: subCatsToCreate, skipDuplicates: true });
            console.log(`[DB INIT] ✅ SUCCESS: ${subCatsToCreate.length} new subcategories created.`);
        } else {
            console.log("[DB INIT] 🟡 INFO: Subcategories already exist.");
        }

        // Seeding States
        console.log('[DB INIT] LOG: Seeding States...');
        const existingStates = await prisma.state.findMany({ select: { uf: true }});
        const existingStateUfs = new Set(existingStates.map(s => s.uf));
        const statesToCreate = sampleStates.filter(state => !existingStateUfs.has(state.uf));
         if (statesToCreate.length > 0) {
            await prisma.state.createMany({ data: statesToCreate, skipDuplicates: true });
            console.log(`[DB INIT] ✅ SUCCESS: ${statesToCreate.length} new states created.`);
        } else {
            console.log("[DB INIT] 🟡 INFO: States already exist.");
        }

        // Seeding Cities
        console.log('[DB INIT] LOG: Seeding Cities...');
        let newCitiesCount = 0;
        for (const city of sampleCities) {
            const existingCity = await prisma.city.findUnique({ where: { ibgeCode: city.ibgeCode } });
            if (!existingCity) {
                await prisma.city.create({ data: city });
                newCitiesCount++;
            }
        }
        console.log(`[DB INIT] ✅ SUCCESS: Processed ${sampleCities.length} cities, ${newCitiesCount} new cities created.`);
        
        // Seeding Courts
        console.log('[DB INIT] LOG: Seeding Courts...');
        const existingCourts = await prisma.court.findMany({ select: { id: true }});
        const existingCourtIds = new Set(existingCourts.map(c => c.id));
        const courtsToCreate = sampleCourts.filter(court => !existingCourtIds.has(court.id));
        if (courtsToCreate.length > 0) {
            // @ts-ignore
            await prisma.court.createMany({ data: courtsToCreate, skipDuplicates: true });
            console.log(`[DB INIT] ✅ SUCCESS: ${courtsToCreate.length} new courts created.`);
        } else {
            console.log("[DB INIT] 🟡 INFO: Courts already exist.");
        }
        
        // Seeding Admin User
        console.log('[DB INIT] LOG: Seeding admin user...');
        const adminUser = sampleUsers.find(u => u.email === 'admin@bidexpert.com.br');
        if (adminUser) {
            const hashedPassword = await bcrypt.hash(adminUser.password || 'Admin@123', 10);
            const adminRole = await prisma.role.findFirst({ where: { name: 'ADMINISTRATOR' } });
            if (adminRole) {
                await prisma.user.upsert({
                    where: { email: adminUser.email },
                    update: {}, // No updates needed if user exists
                    create: {
                        email: adminUser.email,
                        fullName: adminUser.fullName,
                        password: hashedPassword,
                        habilitationStatus: 'HABILITADO',
                        accountType: 'PHYSICAL',
                        roles: {
                          connect: [{ id: adminRole.id }],
                        },
                    },
                });
                console.log("[DB INIT] ✅ SUCCESS: Admin user created or already exists.");
            } else {
                 console.error("[DB INIT] ❌ ERROR: Administrator role not found. Cannot create admin user.");
            }
        } else {
             console.warn("[DB INIT] 🟡 WARNING: Admin user not found in sample data.");
        }


    } catch (error: any) {
        console.error(`[DB INIT] ❌ ERROR seeding essential data: `, error);
        // Do not re-throw, just log the error.
        // throw error; // Commented out to prevent script from crashing
    } finally {
        await prisma.$disconnect();
    }
    
    console.log('--- [DB INIT] LOG: Essential Data seeding finished ---');
}


async function initializeDatabase() {
  console.log('🚀 [DB INIT] LOG: Starting database initialization script...');
  await seedEssentialData();
  console.log("✅ [DB INIT] LOG: Initialization script finished.");
}

initializeDatabase().catch(async (error) => {
    console.error("[DB INIT] ❌ FATAL SCRIPT ERROR during database initialization:", error);
    await prisma.$disconnect();
    process.exit(1);
});
