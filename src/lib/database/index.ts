
// src/lib/database/index.ts
import type { IDatabaseAdapter } from '@/types';
import { FirestoreAdapter } from './firestore.adapter';
import { PostgresAdapter } from './postgres.adapter';
import { MySqlAdapter } from './mysql.adapter';

let dbInstance: IDatabaseAdapter | undefined;

export function getDatabaseAdapter(): IDatabaseAdapter {
  if (dbInstance) {
    return dbInstance;
  }

  const activeSystem = process.env.ACTIVE_DATABASE_SYSTEM || 'MYSQL';
  console.log(`[DB Factory] Initializing adapter for ACTIVE_DATABASE_SYSTEM: ${activeSystem}`);

  switch (activeSystem.toUpperCase()) {
    case 'POSTGRES':
      console.log('[DB Adapter] Using PostgreSQL Adapter');
      dbInstance = new PostgresAdapter();
      break;
    case 'MYSQL':
      console.log('[DB Adapter] Using MySQL Adapter');
      dbInstance = new MySqlAdapter();
      break;
    case 'FIRESTORE':
    default:
      console.log('[DB Adapter] Using Firestore Adapter');
      dbInstance = new FirestoreAdapter();
      break;
  }
  return dbInstance;
}
