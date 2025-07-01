
// src/lib/database/index.ts
import type { IDatabaseAdapter } from '@/types';
import { cookies } from 'next/headers';

let dbInstance: IDatabaseAdapter | undefined;

export async function getDatabaseAdapter(): Promise<IDatabaseAdapter> {
  // If an instance already exists, reuse it immediately.
  if (dbInstance) {
    return dbInstance;
  }

  let dbFromCookie: string | undefined;
  try {
    const cookieStore = cookies();
    dbFromCookie = cookieStore.get('dev-config-db')?.value;
  } catch (e) {
    console.warn('[DB Factory] Could not access cookies. Falling back to environment variables.');
  }
  
  const activeSystemEnv = process.env.ACTIVE_DATABASE_SYSTEM;
  const activeSystem = dbFromCookie || activeSystemEnv?.toUpperCase() || 'SAMPLE_DATA';

  console.log(`[DB Factory - Initializing] Active System: ${activeSystem} (Cookie: ${dbFromCookie || 'N/A'}, Env: ${activeSystemEnv || 'N/A'}).`);

  let newInstance: IDatabaseAdapter | undefined;

  switch (activeSystem) {
    case 'SAMPLE_DATA':
      const { SampleDataAdapter } = await import('./sample-data.adapter');
      newInstance = new SampleDataAdapter();
      break;
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
  
  if (!newInstance) {
     const criticalError = `[DB Factory] CRITICAL: FAILED to create a dbInstance for system: ${activeSystem}.`;
     throw new Error(criticalError);
  }
  
  // Cache the instance for subsequent calls
  dbInstance = newInstance;
  return dbInstance;
}
