
import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// --- IMPORTANT SETUP ---
// 1. Download your Firebase Admin SDK Service Account JSON key.
//    Go to Firebase Console > Project Settings > Service accounts > Generate new private key.
// 2. Store this key securely OUTSIDE your project's version control.
// 3. Set the environment variable GOOGLE_APPLICATION_CREDENTIALS to the FULL PATH of this key file.
//    Alternatively, for local testing, you can replace the line below with:
//    const serviceAccount = require('/path/to/your/serviceAccountKey.json'); // Update this path
//    BUT DO NOT COMMIT THE ACTUAL PATH OR KEY FILE TO GIT.

// Initialize Firebase Admin SDK
try {
  // Try to initialize with GOOGLE_APPLICATION_CREDENTIALS env var
  admin.initializeApp({
    // If your service account key has a projectId, you might not need to specify it here.
    // Otherwise, ensure your service account JSON or this config has it.
    // projectId: "your-firebase-project-id", // Replace if not in your key file
  });
  console.log("Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS.");
} catch (error: any) {
  if (error.code === 'app/no-app') { // Check if the error is because an app wasn't found (might be initialized already)
    console.warn("Firebase Admin SDK might be already initialized or GOOGLE_APPLICATION_CREDENTIALS not set.", error.message);
    // If you have multiple initializations or specific needs, adjust as necessary.
    // For this script, we assume one initialization. If it fails and GAC is not set, it will throw later.
  } else {
      try {
        // Fallback: Hardcode path (USE FOR LOCAL DEV ONLY AND DO NOT COMMIT THIS PATH)
        // REPLACE WITH THE ACTUAL PATH TO YOUR SERVICE ACCOUNT KEY JSON FILE
        const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH || '/path/to/your/serviceAccountKey.json';
        if (serviceAccountPath === '/path/to/your/serviceAccountKey.json') {
            console.error("********************************************************************************");
            console.error("IMPORTANT: Service account path is not set correctly in the script.");
            console.error("Please set the GOOGLE_APPLICATION_CREDENTIALS environment variable OR");
            console.error("update the 'serviceAccountPath' in 'scripts/seed-firestore.ts' with the");
            console.error("correct path to your Firebase Admin SDK service account key JSON file.");
            console.error("Ensure this file is NOT committed to Git.");
            console.error("********************************************************************************");
            process.exit(1);
        }
        const serviceAccount = require(serviceAccountPath); // Make sure this path is correct
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // projectId: "your-firebase-project-id", // Replace if not in your key file
        });
        console.log("Firebase Admin SDK initialized using a local service account key path.");
    } catch (e: any) {
        console.error("Failed to initialize Firebase Admin SDK:", e);
        console.error("Ensure GOOGLE_APPLICATION_CREDENTIALS is set OR the path in the script is correct and the file exists.");
        process.exit(1); // Exit if Firebase Admin can't be initialized
    }
  }
}


const db = admin.firestore();

// Helper function to slugify text (copied from src/lib/sample-data.ts for standalone script use)
const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD") // Normalize to decompose combined graphemes
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

const statesData = [
  { name: "São Paulo", uf: "SP", cities: [
    { name: "São Paulo", ibgeCode: "3550308" },
    { name: "Campinas", ibgeCode: "3509502" },
    { name: "Santos", ibgeCode: "3548500" },
  ]},
  { name: "Rio de Janeiro", uf: "RJ", cities: [
    { name: "Rio de Janeiro", ibgeCode: "3304557" },
    { name: "Niterói", ibgeCode: "3303302" },
    { name: "Petrópolis", ibgeCode: "3303906" },
  ]},
  { name: "Bahia", uf: "BA", cities: [
    { name: "Salvador", ibgeCode: "2927408" },
    { name: "Feira de Santana", ibgeCode: "2910800" },
    { name: "Ilhéus", ibgeCode: "2913606" },
  ]},
  { name: "Minas Gerais", uf: "MG", cities: [
    { name: "Belo Horizonte", ibgeCode: "3106200" },
    { name: "Uberlândia", ibgeCode: "3170206" },
    { name: "Juiz de Fora", ibgeCode: "3136702" },
  ]},
  { name: "Paraná", uf: "PR", cities: [
    { name: "Curitiba", ibgeCode: "4106902" },
    { name: "Londrina", ibgeCode: "4113700" },
    { name: "Maringá", ibgeCode: "4115200" },
  ]},
];

async function seedData() {
  console.log('Starting to seed States and Cities...');

  for (const state of statesData) {
    const stateSlug = slugify(state.name);
    const stateRef = db.collection('states').doc(stateSlug); // Use slug as document ID for states for predictability
    
    console.log(`Processing State: ${state.name} (UF: ${state.uf}, Slug: ${stateSlug})`);

    try {
      // Check if state already exists by its slug-based ID
      const stateDoc = await stateRef.get();
      let stateId = stateSlug; // This will be the document ID

      if (!stateDoc.exists) {
        await stateRef.set({
          name: state.name,
          uf: state.uf.toUpperCase(),
          slug: stateSlug,
          cityCount: 0, // Will be updated if you implement cityCount logic
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        console.log(`Added State: ${state.name} (ID: ${stateId})`);
      } else {
        console.log(`State ${state.name} (ID: ${stateId}) already exists. Skipping state creation.`);
        // If you want to update existing states, add update logic here
        // For example:
        // await stateRef.update({
        //   updatedAt: FieldValue.serverTimestamp(),
        //   // any other fields to update
        // });
        // console.log(`Updated State: ${state.name} (ID: ${stateId})`);
      }

      for (const city of state.cities) {
        const citySlug = slugify(city.name);
        // For cities, it might be better to let Firestore generate IDs or use a composite ID if names aren't unique across states
        // For this test script, let's use slug for city ID as well, assuming city names are unique within a state for this sample.
        // A more robust approach for cities might be stateSlug + '-' + citySlug if you want predictable IDs.
        // Or simply let Firestore auto-generate IDs.
        
        const cityRef = db.collection('cities').doc(`${stateSlug}-${citySlug}`); // Example of a composite predictable ID
        const cityDoc = await cityRef.get();

        if (!cityDoc.exists) {
          await cityRef.set({
            name: city.name,
            slug: citySlug,
            stateId: stateId, // Use the predictable state ID (slug)
            stateUf: state.uf.toUpperCase(),
            ibgeCode: city.ibgeCode || '',
            lotCount: 0,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          console.log(`  Added City: ${city.name} to State: ${state.name} (City ID: ${cityRef.id})`);
        } else {
           console.log(`  City ${city.name} (ID: ${cityRef.id}) in State ${state.name} already exists. Skipping.`);
        }
      }
    } catch (error) {
      console.error(`Error processing state ${state.name} or its cities:`, error);
    }
  }

  console.log('Finished seeding States and Cities.');
}

seedData().catch(console.error);
