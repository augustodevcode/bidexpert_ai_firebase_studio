
// src/scripts/init-db.ts
import { getDatabaseAdapter } from '@/lib/database/index';
import { ensureAdminInitialized } from '@/lib/firebase/admin';
import { 
    samplePlatformSettings,
    sampleRoles,
    sampleLotCategories,
    sampleSubcategories,
    sampleStatesWithCities,
    sampleCourtsWithRelations,
    sampleUsers,
} from '@/lib/sample-data';
import type { DatabaseAdapter, UserCreationData } from '@/types';
import bcrypt from 'bcrypt';

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
    const { auth } = ensureAdminInitialized(); // Get auth instance
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
        console.log('[DB INIT] ✅ SUCCESS: Roles seeded.');
        await seedCollection(db, 'lotCategories', sampleLotCategories);
        console.log('[DB INIT] ✅ SUCCESS: Lot Categories seeded.');
        await seedCollection(db, 'lotSubcategories', sampleSubcategories);
        console.log('[DB INIT] ✅ SUCCESS: Lot Subcategories seeded.');
        
        // Seed hierarchical data for states and cities
        console.log('[DB INIT] LOG: Seeding States and Cities...');
        for (const stateData of sampleStatesWithCities) {
            const { cities, ...state } = stateData;
            const statePath = `states/${state.id}`;
            await db.batchWrite('states', [state]);
            if (cities && cities.length > 0) {
                await db.batchWrite('cities', cities, statePath);
            }
        }
        console.log('[DB INIT] ✅ SUCCESS: States and Cities seeded.');

        console.log('[DB INIT] LOG: Seeding Courts, Districts, and Branches...');
        for (const courtData of sampleCourtsWithRelations) {
            const { districts, ...court } = courtData;
            const courtPath = `courts/${court.id}`;
            await db.batchWrite('courts', [court]);

            if (districts && districts.length > 0) {
                 for (const districtData of districts) {
                    const { branches, ...district } = districtData;
                    const districtWithCourtId = { ...district, courtId: court.id };
                    const districtPath = `${courtPath}/judicialDistricts/${district.id}`;
                    await db.batchWrite('judicialDistricts', [districtWithCourtId], courtPath);

                    if (branches && branches.length > 0) {
                        const branchesWithDistrictId = branches.map(b => ({...b, districtId: district.id}));
                        await db.batchWrite('judicialBranches', branchesWithDistrictId, districtPath);
                    }
                 }
            }
        }
        console.log('[DB INIT] ✅ SUCCESS: Courts, Districts, and Branches seeded.');
        
        // Seed initial admin user if it doesn't exist
        const adminEmail = 'admin@bidexpert.com.br';
        console.log(`[DB INIT] LOG: Checking for admin user '${adminEmail}'...`);
        let adminAuthRecord;
        try {
            adminAuthRecord = await auth.getUserByEmail(adminEmail);
            console.log(`[DB INIT] LOG: Admin user found in Firebase Auth with UID: ${adminAuthRecord.uid}.`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                console.log(`[DB INIT] LOG: Admin user not found in Firebase Auth. Creating...`);
                const userData = sampleUsers.find(u => u.email === adminEmail);
                if (userData) {
                    adminAuthRecord = await auth.createUser({
                        uid: userData.uid, // Using predefined UID from sample data for consistency
                        email: userData.email,
                        password: userData.password,
                        displayName: userData.fullName,
                    });
                     console.log('[DB INIT] ✅ SUCCESS: Admin user created in Firebase Auth.');
                } else {
                    console.error('[DB INIT] ❌ ERROR: Sample data for admin user not found.');
                    return; // Stop if admin can't be created
                }
            } else {
                throw error; // Re-throw other auth errors
            }
        }

        const firestoreUser = await db.getUserProfileData(adminAuthRecord.uid);
        if (!firestoreUser) {
            console.log(`[DB INIT] LOG: Admin user document not found in Firestore. Creating...`);
            const adminRole = sampleRoles.find(r => r.nameNormalized === 'ADMINISTRATOR');
            const userData = sampleUsers.find(u => u.email === adminEmail);
            if (userData && adminRole) {
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                const userCreationPayload: UserCreationData = {
                    ...userData,
                    uid: adminAuthRecord.uid,
                    password: hashedPassword,
                    roleIds: [adminRole.id],
                };
                await db.createUser(userCreationPayload);
                console.log('[DB INIT] ✅ SUCCESS: Admin user document created in Firestore.');
            } else {
                 console.error('[DB INIT] ❌ ERROR: Admin user data or Admin role not found in sample data.');
            }
        } else {
             console.log('[DB INIT] 🟡 INFO: Admin user document already exists in Firestore.');
        }

    } catch (error: any) {
        console.error(`[DB INIT] ❌ FATAL ERROR seeding essential data: ${error.message}`);
        console.error("Stack Trace:", error.stack);
        const zodError = (error.name === 'ZodError') ? error.issues : null;
        console.error("Zod Issues (if any):", JSON.stringify(zodError, null, 2));
        throw error; 
    }
    
    console.log('--- [DB INIT] LOG: Essential Data seeding finished ---');
    console.log("💡 [DB INIT] NEXT STEP: To populate with demo data (auctions, lots, etc.), run 'npm run db:seed' in a separate terminal.");
}


async function initializeDatabase() {
  console.log('🚀 [DB INIT] LOG: Starting database initialization script...');
  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'FIRESTORE';
  console.log(`[DB INIT] LOG: Active database system is configured to: ${activeSystem}`);

  await seedEssentialData();
  
  console.log("✅ [DB INIT] LOG: Initialization script finished successfully.");
}

initializeDatabase().catch(error => {
    console.error("[DB INIT] ❌ FATAL ERROR during database initialization:", error);
    process.exit(1);
});
