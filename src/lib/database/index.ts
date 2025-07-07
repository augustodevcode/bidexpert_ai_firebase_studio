// src/lib/database/index.ts
import type { IDatabaseAdapter } from '@/types';
import { cookies } from 'next/headers'; // This is a dynamic function

// Singleton instance specifically for the SampleDataAdapter
let sampleDbInstance: IDatabaseAdapter | undefined;

export async function getDatabaseAdapter(): Promise<IDatabaseAdapter> {
  // Reading cookies opts the request into dynamic rendering, so noStore() is not needed.
  
  let dbFromCookie: string | undefined;
  try {
    // cookies() is a dynamic function and will only work in a request context.
    // During build or in non-request environments, it will throw an error.
    const cookieStore = cookies();
    dbFromCookie = cookieStore.get('dev-config-db')?.value;
  } catch (e) {
    // This is expected during build or in environments without a request context.
    // The fallback logic will handle these cases.
    console.warn('[DB Factory] Could not access cookies. This is expected during build. Falling back to environment variables.');
  }

  const activeSystemEnv = process.env.ACTIVE_DATABASE_SYSTEM;
  // Priority: 1. Cookie, 2. Env Var, 3. Fallback to SAMPLE_DATA
  const activeSystem = (dbFromCookie || activeSystemEnv || 'SAMPLE_DATA').toUpperCase();

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
