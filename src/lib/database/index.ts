// src/lib/database/index.ts
import type { IDatabaseAdapter } from '@/types';

// Singleton instance specifically for the SampleDataAdapter
let sampleDbInstance: IDatabaseAdapter | undefined;

export async function getDatabaseAdapter(): Promise<IDatabaseAdapter> {
  // Server-side logic should ONLY rely on environment variables to avoid build-time errors
  // with dynamic functions like `cookies()`. The cookie is for the client-side indicator only.
  const activeSystem = (process.env.ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA').toUpperCase();

  console.log(`[DB Factory - Initializing] Active System: ${activeSystem} (From Env).`);

  // If the active system is SAMPLE_DATA, use a singleton pattern.
  if (activeSystem === 'SAMPLE_DATA') {
    if (!sampleDbInstance) {
      const { SampleDataAdapter } = await import('./sample-data.adapter');
      console.log('[DB Factory] Creating new singleton instance for SampleDataAdapter.');
      sampleDbInstance = new SampleDataAdapter();
    } else {
      console.log('[DB Factory] Returning existing singleton instance of SampleDataAdapter.');
    }
    return sampleDbInstance;
  }
  
  // For all other database types, create a new instance for each request (stateless).
  let newInstance: IDatabaseAdapter;

  switch (activeSystem) {
    case 'POSTGRES':
      const { PostgresAdapter } = await import('./postgres.adapter');
      newInstance = new PostgresAdapter();
      break;
    case 'MYSQL':
      const { MySqlAdapter } = await import('./mysql.adapter');
      newInstance = new MySqlAdapter();
      break;
    case 'FIRESTORE': {
        const { ensureAdminInitialized } = await import('@/lib/firebase/admin');
        const { FirestoreAdapter } = await import('./firestore.adapter');
        const { db: dbAdmin, error: sdkError } = ensureAdminInitialized();
        if (sdkError || !dbAdmin) {
            const errorMessage = `[DB Factory] Failed to initialize Firebase Admin SDK for Firestore Adapter: ${sdkError?.message || 'dbAdmin instance is null'}`;
            throw new Error(errorMessage);
        }
        newInstance = new FirestoreAdapter(dbAdmin);
        break;
    }
    default:
      const errorMessage = `[DB Factory] FATAL: Unsupported or misconfigured database system: '${activeSystem}'.`;
      throw new Error(errorMessage);
  }
  
  return newInstance;
}
