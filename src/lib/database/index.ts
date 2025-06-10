
// src/lib/database/index.ts
import type { IDatabaseAdapter } from '@/types';

let dbInstance: IDatabaseAdapter | undefined;

export async function getDatabaseAdapter(): Promise<IDatabaseAdapter> {
  const activeSystemEnv = process.env.ACTIVE_DATABASE_SYSTEM;
  console.log(`[DB Factory - getDatabaseAdapter ENTER] ACTIVE_DATABASE_SYSTEM: ${activeSystemEnv}. dbInstance type before logic: ${dbInstance?.constructor?.name}`);

  if (dbInstance) {
    console.log(`[DB Factory] Attempting to reuse existing dbInstance. Type: ${dbInstance.constructor.name}`);
    // Verificação de sanidade na instância cacheada
    if (typeof (dbInstance as any).getBidsForLot !== 'function') {
        console.error('[DB Factory] Cached dbInstance is malformed! Does not have getBidsForLot. Forcing re-initialization.');
        dbInstance = undefined; // Força a re-inicialização se a instância estiver corrompida
    } else {
        console.log('[DB Factory] Reusing valid existing dbInstance.');
        return dbInstance;
    }
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
    // O case 'FIRESTORE' foi removido conforme solicitado anteriormente para isolamento.
    // Se precisar reativar, ele estava assim:
    /*
    case 'FIRESTORE':
    default: // Defaulting to FIRESTORE if not recognized or for dev without explicit setting
      console.log('[DB Adapter] Dynamically importing Firestore Adapter and Admin SDK module...');
      const adminModule = await import('@/lib/firebase/admin');
      const { FirestoreAdapter } = await import('./firestore.adapter');
      
      const { db, error: sdkError } = adminModule.ensureAdminInitialized();
      if (sdkError || !db) {
        const errorMessage = `[DB Factory] Failed to initialize Firestore Admin SDK for FirestoreAdapter: ${sdkError?.message || 'dbAdmin not available'}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      dbInstance = new FirestoreAdapter(db); 
      console.log('[DB Adapter] Firestore Adapter initialized.');
      break;
    */
    default:
      const errorMessage = `[DB Factory] FATAL: Unsupported or misconfigured database system: '${activeSystem}'. Please set ACTIVE_DATABASE_SYSTEM to 'POSTGRES', or 'MYSQL'.`;
      console.error(errorMessage);
      throw new Error(errorMessage);
  }
  
  if (dbInstance) {
    console.log(`[DB Factory - getDatabaseAdapter EXIT] dbInstance created/re-initialized. Type: ${dbInstance.constructor.name}, Has getBidsForLot: ${typeof (dbInstance as any).getBidsForLot === 'function'}`);
  } else {
    // Este caso não deveria acontecer se o switch tiver um default que lança erro ou instancia.
    const criticalError = `[DB Factory - getDatabaseAdapter EXIT] CRITICAL: FAILED to create dbInstance for system: ${activeSystem}.`;
    console.error(criticalError);
    throw new Error(criticalError);
  }
  return dbInstance;
}

