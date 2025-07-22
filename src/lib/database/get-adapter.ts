// src/lib/database/get-adapter.ts
// THIS FILE SHOULD NOT CONTAIN 'use server' or 'use client' and can be used in scripts.
import { FirestoreAdapter } from './firestore.adapter';
// import { MySqlAdapter } from './mysql.adapter'; // Uncomment when implemented
// import { PostgresAdapter } from './postgres.adapter'; // Uncomment when implemented
import type { DatabaseAdapter } from '@/types';

let adapterInstance: DatabaseAdapter | null = null;
let lastDbSystem: string | null = null;

/**
 * Retorna uma instância singleton do adaptador de banco de dados apropriado
 * com base na variável de ambiente NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM.
 * @returns {DatabaseAdapter} Uma instância do adaptador de banco de dados.
 */
export const getDatabaseAdapter = (): DatabaseAdapter => {
  const dbSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'FIRESTORE';
  
  // If the desired system has changed, or if there's no instance, create a new one.
  if (dbSystem !== lastDbSystem || !adapterInstance) {
    console.log(`[getDatabaseAdapter] System changed or no instance. Initializing for: ${dbSystem}`);
    lastDbSystem = dbSystem;

    switch (dbSystem) {
      // case 'MYSQL':
      //   adapterInstance = new MySqlAdapter();
      //   break;
      // case 'POSTGRES':
      //   adapterInstance = new PostgresAdapter();
      //   break;
      case 'FIRESTORE':
      default:
        adapterInstance = new FirestoreAdapter();
        break;
    }
  }

  return adapterInstance;
};
