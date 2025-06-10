
// src/lib/database/index.ts
import type { IDatabaseAdapter } from '@/types';

let dbInstance: IDatabaseAdapter | undefined;

export async function getDatabaseAdapter(): Promise<IDatabaseAdapter> {
  if (dbInstance) {
    console.log(`[DB Factory] Reusing existing dbInstance for ${process.env.ACTIVE_DATABASE_SYSTEM || 'NOT_SET'}`);
    return dbInstance;
  }

  const activeSystem = process.env.ACTIVE_DATABASE_SYSTEM || 'MYSQL'; // Defaulting to MYSQL
  console.log(`[DB Factory] Initializing adapter for ACTIVE_DATABASE_SYSTEM: ${activeSystem}`);

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
      const adminModule = await import('@/lib/firebase/admin');
      const { FirestoreAdapter } = await import('./firestore.adapter');
      
      const { db, error: sdkError } = adminModule.ensureAdminInitialized(); // ensureAdminInitialized is now async if it needs to be
      if (sdkError || !db) {
        const errorMessage = `[DB Factory] Failed to initialize Firestore Admin SDK for FirestoreAdapter: ${sdkError?.message || 'dbAdmin not available'}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      dbInstance = new FirestoreAdapter(db); // Pass the initialized db instance
      console.log('[DB Adapter] Firestore Adapter initialized.');
      break;
    default:
      console.error(`[DB Factory] Unsupported database system: ${activeSystem}. Defaulting to MySQL (if configured).`);
      // Fallback to MySQL if an unknown system is specified but MYSQL_CONNECTION_STRING might be available
      if (process.env.MYSQL_CONNECTION_STRING) {
        console.log('[DB Adapter] Fallback: Dynamically importing MySQL Adapter...');
        const { MySqlAdapter: MySqlFallback } = await import('./mysql.adapter');
        dbInstance = new MySqlFallback();
        console.log('[DB Adapter] MySQL Adapter initialized as fallback.');
      } else {
        throw new Error(`Unsupported database system: ${activeSystem} and no fallback could be initialized.`);
      }
      break;
  }
  return dbInstance;
}
