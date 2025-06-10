// src/lib/database/index.ts
import type { IDatabaseAdapter } from '@/types';

let dbInstance: IDatabaseAdapter | undefined;

// Moved ensureAdminInitializedForFirestore import inside the FIRESTORE case
// to prevent it from being evaluated if not FIRESTORE.
// let ensureAdminInitializedForFirestore: typeof import('@/lib/firebase/admin').ensureAdminInitialized | undefined;

export async function getDatabaseAdapter(): Promise<IDatabaseAdapter> {
  // LOGGING FOR DIAGNOSIS
  console.log(`[DB Factory - getDatabaseAdapter TOP] process.env.ACTIVE_DATABASE_SYSTEM: ${process.env.ACTIVE_DATABASE_SYSTEM}`);

  if (dbInstance) {
    console.log(`[DB Factory] Reusing existing dbInstance for ${process.env.ACTIVE_DATABASE_SYSTEM || 'NOT_SET'}`);
    return dbInstance;
  }

  const activeSystem = process.env.ACTIVE_DATABASE_SYSTEM || 'MYSQL'; // Defaulting to MYSQL if not set
  console.log(`[DB Factory] Initializing adapter for ACTIVE_DATABASE_SYSTEM (resolved): ${activeSystem}`);

  switch (activeSystem.toUpperCase()) {
    case 'POSTGRES':
      console.log('[DB Adapter] Dynamically importing PostgreSQL Adapter...');
      const { PostgresAdapter } = await import('./postgres.adapter');
      dbInstance = new PostgresAdapter();
      console.log('[DB Adapter] PostgreSQL Adapter initialized.');
      break;
    case 'MYSQL':
      console.log('[DB Adapter] Dynamically importing MySQL Adapter...');
      const { MySqlAdapter } = await import('./mysql.adapter');
      dbInstance = new MySqlAdapter();
      console.log('[DB Adapter] MySQL Adapter initialized.');
      break;
    case 'FIRESTORE':
      console.log('[DB Adapter] Dynamically importing Firestore Adapter and Firebase Admin module...');
      
      // Dynamically import firebase/admin only when FIRESTORE is selected
      const adminModule = await import('@/lib/firebase/admin');
      const ensureAdminInitializedForFirestore = adminModule.ensureAdminInitialized;
      
      const { FirestoreAdapter } = await import('./firestore.adapter');
      
      const { db, error: sdkError } = ensureAdminInitializedForFirestore(); 
      if (sdkError || !db) {
        const errorMessage = `[DB Factory] Failed to initialize Firestore Admin SDK for FirestoreAdapter: ${sdkError?.message || 'dbAdmin not available'}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      dbInstance = new FirestoreAdapter(db);
      console.log('[DB Adapter] Firestore Adapter initialized.');
      break;
    default:
      console.error(`[DB Factory] FATAL: Unsupported or misconfigured database system: '${activeSystem}'. Please set ACTIVE_DATABASE_SYSTEM to 'FIRESTORE', 'POSTGRES', or 'MYSQL'.`);
      // No longer defaulting to MySQL if invalid, to make misconfiguration more obvious.
      throw new Error(`Unsupported database system: ${activeSystem}. Please set ACTIVE_DATABASE_SYSTEM to 'FIRESTORE', 'POSTGRES', or 'MYSQL'.`);
  }
  return dbInstance;
}
