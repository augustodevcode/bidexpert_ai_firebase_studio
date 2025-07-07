// src/lib/database/index.ts
import type { IDatabaseAdapter } from '@/types';
import { cookies } from 'next/headers'; // This is a dynamic function

export async function getDatabaseAdapter(): Promise<IDatabaseAdapter> {
  // Reading cookies opts the request into dynamic rendering.
  
  let dbFromCookie: string | undefined;
  try {
    // cookies() is a dynamic function and will only work in a request context.
    const cookieStore = cookies();
    dbFromCookie = cookieStore.get('dev-config-db')?.value;
  } catch (e) {
    // This is expected during build or in environments without a request context.
    console.warn('[DB Factory] Could not access cookies. This is expected during build. Falling back to environment variables.');
  }

  const activeSystemEnv = process.env.ACTIVE_DATABASE_SYSTEM;
  // Priority: 1. Cookie, 2. Env Var, 3. Fallback to SAMPLE_DATA
  const activeSystem = (dbFromCookie || activeSystemEnv || 'SAMPLE_DATA').toUpperCase();

  console.log(`[DB Factory - Initializing] Active System: ${activeSystem} (Cookie: ${dbFromCookie || 'N/A'}, Env: ${activeSystemEnv || 'N/A'}).`);

  // Always create a new instance based on the determined active system.
  // This removes the faulty singleton pattern for SampleData.
  let newInstance: IDatabaseAdapter;

  switch (activeSystem) {
    case 'SAMPLE_DATA': {
      const { SampleDataAdapter } = await import('./sample-data.adapter');
      newInstance = new SampleDataAdapter();
      break;
    }
    case 'POSTGRES': {
      const { PostgresAdapter } = await import('./postgres.adapter');
      newInstance = new PostgresAdapter();
      break;
    }
    case 'MYSQL': {
      const { MySqlAdapter } = await import('./mysql.adapter');
      newInstance = new MySqlAdapter();
      break;
    }
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
