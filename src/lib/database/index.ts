// src/lib/database/index.ts
import type { IDatabaseAdapter } from '@/types';

// Singleton instance specifically for the SampleDataAdapter
let sampleDbInstance: IDatabaseAdapter | undefined;

export async function getDatabaseAdapter(): Promise<IDatabaseAdapter> {
  // The cookies() function is a dynamic function that can only be used in a Server Component,
  // Route Handler, or Server Action. It will throw an error if used during build time
  // or in standalone scripts.
  let dbFromCookie: string | undefined;
  try {
    // Use dynamic import to avoid static analysis errors during build
    const { cookies } = await import('next/headers');
    const cookieStore = cookies();
    dbFromCookie = cookieStore.get('dev-config-db')?.value;
  } catch (e) {
    // This can happen during build or in environments without request context. Fallback is safe.
    console.warn('[DB Factory] Could not access cookies. Falling back to environment variables.');
  }
  
  const activeSystemEnv = process.env.ACTIVE_DATABASE_SYSTEM;
  const activeSystem = dbFromCookie || activeSystemEnv?.toUpperCase() || 'SAMPLE_DATA';

  console.log(`[DB Factory - Initializing] Active System: ${activeSystem} (Cookie: ${dbFromCookie || 'N/A'}, Env: ${activeSystemEnv || 'N/A'}).`);

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
