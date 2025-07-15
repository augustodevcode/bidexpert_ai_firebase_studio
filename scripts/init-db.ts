// src/scripts/init-db.ts
import { getDatabaseAdapter } from '@/lib/database/index';
import { 
    samplePlatformSettings,
    sampleRoles,
    sampleLotCategories,
    sampleSubcategories,
    sampleStatesWithCities,
    sampleCourtsWithRelations,
    sampleUsers,
} from '@/lib/sample-data';
import type { DatabaseAdapter, StateInfo, CityInfo, Court, JudicialDistrict, JudicialBranch } from '@/types';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

async function seedCollection(db: DatabaseAdapter, collectionName: string, data: any[], parentDocPath?: string) {
    if (!data || data.length === 0) {
        console.log(`[DB INIT] 🟡 INFO: No data provided for ${collectionName}. Skipping.`);
        return;
    }

    console.log(`[DB INIT] LOG: Seeding ${collectionName} ${parentDocPath ? `under ${parentDocPath}` : ''}...`);
    // @ts-ignore
    await db.batchWrite(collectionName, data, parentDocPath);
    console.log(`[DB INIT] ✅ SUCCESS: ${data.length} items processed for ${collectionName}.`);
}


async function seedEssentialData() {
    console.log('\n--- [DB INIT] LOG: Seeding Essential Data ---');
    const db = getDatabaseAdapter(); 
    
    try {
        // Platform Settings (Single Document)
        console.log('[DB INIT] LOG: Seeding platform settings...');
        const settings = await db.getPlatformSettings();
        if (!settings) {
            await db.createPlatformSettings(samplePlatformSettings);
            console.log("[DB INIT] ✅ SUCCESS: Platform settings created.");
        } else {
            console.log("[DB INIT] 🟡 INFO: Platform settings already exist.");
        }

        // Top-level collections that don't depend on others
        await seedCollection(db, 'roles', sampleRoles);
        await seedCollection(db, 'lotCategories', sampleLotCategories);
        await seedCollection(db, 'lotSubcategories', sampleSubcategories);
        
        // Seed hierarchical data
        for (const stateData of sampleStatesWithCities) {
            const { cities, ...state } = stateData;
            await seedCollection(db, 'states', [state]);
            if (cities && cities.length > 0) {
                await seedCollection(db, 'cities', cities, `states/${state.id}`);
            }
        }
        
        for (const courtData of sampleCourtsWithRelations) {
            const { districts, ...court } = courtData;
            await seedCollection(db, 'courts', [court]);
            if (districts && districts.length > 0) {
                const districtsToSeed = districts.map(({branches, ...d}) => ({...d, courtId: court.id}));
                await seedCollection(db, 'judicialDistricts', districtsToSeed, `courts/${court.id}`);

                for (const district of districts) {
                    if (district.branches && district.branches.length > 0) {
                         const branchesToSeed = district.branches.map(b => ({...b, districtId: district.id}));
                         await seedCollection(db, 'judicialBranches', branchesToSeed, `courts/${court.id}/judicialDistricts/${district.id}`);
                    }
                }
            }
        }
        
        // Seed initial admin user if it doesn't exist
        const adminEmail = 'admin@bidexpert.com.br';
        let adminUser = await db.getUserProfileData(adminEmail);
        if (!adminUser) {
            console.log(`[DB INIT] Admin user not found. Creating...`);
            const adminRole = sampleRoles.find(r => r.nameNormalized === 'ADMINISTRATOR');
            const userData = sampleUsers.find(u => u.email === adminEmail);
            if (userData && adminRole) {
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                await db.createUser({
                    ...userData,
                    password: hashedPassword,
                    roleIds: [adminRole.id],
                });
                console.log('[DB INIT] ✅ SUCCESS: Admin user created.');
            } else {
                 console.error('[DB INIT] ❌ ERROR: Admin user data or Admin role not found in sample data.');
            }
        } else {
             console.log('[DB INIT] 🟡 INFO: Admin user already exists.');
        }


    } catch (error: any) {
        console.error(`[DB INIT] ❌ ERROR seeding essential data: ${error.message}`);
        const zodError = (error.name === 'ZodError') ? error.issues : null;
        console.error("Zod Issues (if any):", JSON.stringify(zodError, null, 2));
        throw error; 
    }
    
    console.log('--- [DB INIT] LOG: Essential Data seeding finished ---');
}


async function initializeDatabase() {
  console.log('🚀 [DB INIT] LOG: Starting database initialization script...');
  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'FIRESTORE';
  console.log(`[DB INIT] LOG: Active database system is configured to: ${activeSystem}`);

  await seedEssentialData();
  
  console.log("✅ [DB INIT] LOG: Initialization script finished.");
}

initializeDatabase().catch(error => {
    console.error("[DB INIT] ❌ FATAL ERROR during database initialization:", error);
    process.exit(1);
});
