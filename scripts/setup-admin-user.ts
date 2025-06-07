// scripts/setup-admin-user.ts
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Path to your service account key file relative to the project root
const serviceAccountPath = path.resolve(__dirname, '../bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json');
const targetEmail = 'augusto.devcode@gmail.com';
const targetRoleName = 'ADMINISTRATOR';

// Ensure the Admin SDK is initialized
let dbAdmin: admin.firestore.Firestore;
let authAdmin: admin.auth.Auth;

async function initializeAdminSDK() {
    if (admin.apps.length > 0) {
        console.log('[Admin Script] Firebase Admin SDK already initialized.');
        const app = admin.apps[0]!;
        dbAdmin = app.firestore();
        authAdmin = app.auth();
        return;
    }

    console.log('[Admin Script] Initializing Firebase Admin SDK...');

    if (!fs.existsSync(serviceAccountPath)) {
        console.error(`[Admin Script] CRITICAL ERROR: Service account key file NOT FOUND at: ${serviceAccountPath}`);
        console.error('[Admin Script] Please ensure the file name is correct and it exists at the project root.');
        process.exit(1); // Exit if key file is missing
    }

    try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        const app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // projectId: serviceAccount.project_id, // Optional, but good practice
        });
        console.log('[Admin Script] Firebase Admin SDK initialized successfully.');
        dbAdmin = app.firestore();
        authAdmin = app.auth();
    } catch (error: any) {
        console.error('[Admin Script] CRITICAL ERROR during Admin SDK initialization:', error);
        process.exit(1); // Exit on initialization failure
    }
}
async function getRoleByName(roleName: string): Promise<admin.firestore.DocumentData | null> {

    if (!dbAdmin) {
        console.error('[Admin Script] Firestore Admin DB not available to getRoleByName.');
        return null;
    }
    console.log(`[Admin Script] Looking for role: ${roleName}`);
    try {
        // Assuming 'roles' collection exists and role documents have a 'name' field
        const rolesRef = dbAdmin.collection('roles');
        const q = rolesRef!.where('name', '==', roleName).limit(1);
        const snapshot = await q.get();

        if (!snapshot.empty) {
            const roleDoc = snapshot.docs[0];
            console.log(`[Admin Script] Found role '${roleName}' with ID: ${roleDoc.id}`);
            return { id: roleDoc.id, ...roleDoc.data() };
        } else {
            console.warn(`[Admin Script] Role '${roleName}' not found in Firestore.`);
            // Optional: You might want to create the default roles if they are missing
            return null;
        }
    } catch (error: any) {
        console.error(`[Admin Script] Error fetching role '${roleName}':`, error);
        return null;
    }
}

async function setupAdminUser() {
    await initializeAdminSDK();

    // Ensure SDK is available after initialization
    if (!dbAdmin || !authAdmin) {
         console.error('[Admin Script] Admin SDK not available after initialization attempt. Exiting.');
         process.exit(1);
    }

    console.log(`[Admin Script] Setting up user ${targetEmail} as ${targetRoleName}...`);

    try {
        // 1. Find the target role. Use non-null assertion as we check it immediately after.
        const adminRole = await getRoleByName(targetRoleName);

        if (!adminRole) {
            console.error(`[Admin Script] Could not find the '${targetRoleName}' role. Please ensure default roles exist in Firestore.`);
            process.exit(1); // Cannot proceed without the role
        }

        let userRecord: admin.auth.UserRecord;
        let userExistsInAuth = false;

        // 2. Check if user exists in Auth
        try {
            userRecord = await authAdmin!.getUserByEmail(targetEmail);
            userExistsInAuth = true;
            console.log(`[Admin Script] User found in Firebase Auth with UID: ${userRecord.uid}`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                console.log(`[Admin Script] User ${targetEmail} not found in Firebase Auth. Creating...`);
                // 3. If user not found in Auth, create them
                 try {
                     userRecord = await authAdmin!.createUser({
                        email: targetEmail,
                        emailVerified: false, // You can set this based on your needs
                        disabled: false,
                        // Optional: Add a temporary password if needed for initial login, but be mindful of security
                        // password: 'temporary-password',
                     });
                     console.log(`[Admin Script] User created in Firebase Auth with UID: ${userRecord.uid}`);
                 } catch (createError: any) {
                     console.error(`[Admin Script] Error creating user ${targetEmail} in Auth:`, createError);
                     process.exit(1);
                 }
            } else {
                console.error(`[Admin Script] Error checking user ${targetEmail} in Auth:`, error);
                process.exit(1);
            }
        }

        // 4. Update or create user document in Firestore
        const userDocRef = dbAdmin!.collection('users').doc(userRecord.uid);
        const userDoc = await userDocRef.get();

        const userProfileData: any = {
            uid: userRecord.uid,
            email: userRecord.email!, // Email is guaranteed to exist if we created or found the user
            fullName: userRecord.displayName || targetEmail.split('@')[0], // Use display name if available, otherwise part of email
            roleId: adminRole!.id,
            roleName: adminRole!.name,
            permissions: adminRole.permissions || [],
            status: 'ATIVO', // Assuming active status
            habilitationStatus: 'HABILITADO', // Habilitado for admin
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (!userExistsInAuth || !userDoc.exists) {
            // User document doesn't exist in Firestore, create it
             console.log(`[Admin Script] User document for UID ${userRecord.uid} not found in Firestore. Creating...`);
             userProfileData.createdAt = admin.firestore.FieldValue.serverTimestamp();
             await userDocRef.set(userProfileData);
             console.log(`[Admin Script] User document for UID ${userRecord.uid} created in Firestore.`);

        } else {
            // User document exists, update it
            console.log(`[Admin Script] User document for UID ${userRecord.uid} found in Firestore. Updating...`);

            // Prepare update payload - only include fields we manage via this script
            const updatePayload: any = {
                roleId: adminRole!.id,
                roleName: adminRole!.name,
                permissions: adminRole.permissions || [],
                habilitationStatus: 'HABILITADO',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                 // Remove legacy 'role' field if it exists
                role: admin.firestore.FieldValue.delete(),
            };

            // Keep existing fullName if it exists and is not empty, unless we just created the user in Auth
            if (userDoc.data()?.fullName && typeof userDoc.data().fullName === 'string' && userDoc.data().fullName.trim() !== '' && userExistsInAuth) {
                 // Don't update fullName if it existed and we just updated
                 delete updatePayload.fullName;
            } else {
                 // Use the name from Auth record if we just created/synced Auth, or if Firestore name was missing/empty
                 updatePayload.fullName = userRecord.displayName || targetEmail.split('@')[0];
            }


            await userDocRef.update(updatePayload);
            console.log(`[Admin Script] User document for UID ${userRecord.uid} updated in Firestore with ADMIN role.`);
        }

        console.log(`[Admin Script] Setup for ${targetEmail} as ${targetRoleName} completed successfully.`);

    } catch (error: any) {
        console.error(`[Admin Script] An error occurred during admin user setup for ${targetEmail}:`, error);
        process.exit(1);
    }
}

// Execute the script
setupAdminUser();