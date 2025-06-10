// src/lib/database/index.ts
import type { IDatabaseAdapter } from '@/types';

let dbInstance: IDatabaseAdapter | undefined;

export async function getDatabaseAdapter(): Promise<IDatabaseAdapter> {
  // LOGGING FOR DIAGNOSIS
  const activeSystemEnv = process.env.ACTIVE_DATABASE_SYSTEM;
  console.log(`[DB Factory - getDatabaseAdapter TOP] Raw process.env.ACTIVE_DATABASE_SYSTEM: ${activeSystemEnv}`);

  if (dbInstance) {
    console.log(`[DB Factory] Reusing existing dbInstance for ${activeSystemEnv || 'NOT_SET (defaulting below)'}`);
    return dbInstance;
  }

  const activeSystem = activeSystemEnv || 'MYSQL'; // Defaulting to MYSQL if not set
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
      console.log('[DB Adapter] Dynamically importing Firestore Adapter and Admin SDK module...');
      // Import admin SDK utilities ONLY when Firestore is selected
      const adminModule = await import('@/lib/firebase/admin'); // This line might still cause admin.ts to be evaluated.
      const { FirestoreAdapter } = await import('./firestore.adapter');
      
      const { db, error: sdkError } = adminModule.ensureAdminInitialized();
      if (sdkError || !db) {
        const errorMessage = `[DB Factory] Failed to initialize Firestore Admin SDK for FirestoreAdapter: ${sdkError?.message || 'dbAdmin not available'}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      dbInstance = new FirestoreAdapter(db); // Pass the initialized db instance
      console.log('[DB Adapter] Firestore Adapter initialized.');
      break;
    default:
      const errorMessage = `[DB Factory] FATAL: Unsupported or misconfigured database system: '${activeSystem}'. Please set ACTIVE_DATABASE_SYSTEM to 'FIRESTORE', 'POSTGRES', or 'MYSQL'.`;
      console.error(errorMessage);
      throw new Error(errorMessage);
  }
  return dbInstance;
}
