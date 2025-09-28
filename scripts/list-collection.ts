// scripts/list-collection.ts
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs'; // Import the 'fs' module

// ============================================================================
// ATTENTION: Service Account Key Configuration
// ============================================================================
// Replace '/path/to/your/serviceAccountKey.json' with the actual path
// to your service account key JSON file.
// KEEP THIS FILE SECURE AND OUT OF VERSION CONTROL (git).
// Consider using environment variables for the path in production environments.
const serviceAccountPath = '/home/user/studio/bidexpert-630df-firebase-adminsdk-fbsvc-4c89838d15.json'; // <--- CAMINHO CORRIGIDO
// ============================================================================


try {
  // Initialize the Firebase Admin SDK if it hasn't been initialized yet
  if (!admin.apps.length) {
    // Load the service account key using fs and JSON.parse
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Add other configurations like databaseURL, storageBucket if needed
      // databaseURL: "https://<DATABASE_NAME>.firebaseio.com",
    });
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  console.error('Please ensure the path to the service account key is correct:', serviceAccountPath);
  process.exit(1); // Exit the process with an error code
}

const db = admin.firestore();

// Function to list documents from a collection and format as a table
async function listCollection(collectionName: string) {
  try {
    console.log(`Listing documents from collection: "${collectionName}"`);
    const collectionRef = db.collection(collectionName);
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
      console.log(`Collection "${collectionName}" is empty or does not exist.`);
      return;
    }

    // Prepare data for the table
    const data: any[] = [];
    const headers: Set<string> = new Set(['ID']);

    snapshot.forEach(doc => {
      const docData = doc.data();
      const row: any = { 'ID': doc.id };
      for (const key in docData) {
        if (Object.prototype.hasOwnProperty.call(docData, key)) {
          headers.add(key);
          // Format complex values (objects, arrays) for display
          row[key] = typeof docData[key] === 'object' && docData[key] !== null && !Array.isArray(docData[key])
                       ? JSON.stringify(docData[key])
                       : Array.isArray(docData[key])
                       ? `[${docData[key].length} items]` // Indicate array size
                       : docData[key];
        }
      }
      data.push(row);
    });

    // Convert Set of headers to Array
    const headerArray = Array.from(headers);

    // Calculate column widths
    const columnWidths: { [key: string]: number } = {};
    headerArray.forEach(header => {
        columnWidths[header] = header.length;
    });

    data.forEach(row => {
        headerArray.forEach(header => {
            const cell = String(row[header] || '');
            columnWidths[header] = Math.max(columnWidths[header], cell.length);
        });
    });

    // Print header
    let headerLine = '';
    headerArray.forEach(header => {
        headerLine += header.padEnd(columnWidths[header]) + ' | ';
    });
    console.log(headerLine.slice(0, -3)); // Remove last ' | '
    console.log('-'.repeat(headerLine.length - 1)); // Separator matches header length

    // Print data
    data.forEach(row => {
        let dataLine = '';
        headerArray.forEach(header => {
            const cell = String(row[header] || '');
             dataLine += cell.padEnd(columnWidths[header]) + ' | ';
        });
        console.log(dataLine.slice(0, -3)); // Remove last ' | '
    });

    console.log(`\nSuccessfully listed ${data.length} documents from collection "${collectionName}".`);


  } catch (error) {
    console.error(`Error listing collection "${collectionName}":`, error);
    console.error('Error details:', error);
  }
}

// Capture command-line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: ts-node scripts/list-collection.ts <collection_name>');
  process.exit(1); // Exit the process indicating usage error
}

const collectionName = args[0];

// Execute the list function
listCollection(collectionName);
