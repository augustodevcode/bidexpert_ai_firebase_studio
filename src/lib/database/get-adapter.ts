
// src/lib/database/get-adapter.ts
// THIS FILE SHOULD NOT CONTAIN 'use server' or 'use client' and can be used in scripts.
import { FirestoreAdapter } from './firestore.adapter';
import { MySqlAdapter } from './mysql.adapter';
import { SampleDataAdapter } from './sample-data.adapter';
import type { DatabaseAdapter } from '@/types';

let adapterInstance: DatabaseAdapter | null = null;
let currentDbSystem: string | null = null;

/**
 * Retorna uma instância singleton do adaptador de banco de dados apropriado
 * com base na variável de ambiente NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM.
 * @returns {DatabaseAdapter} Uma instância do adaptador de banco de dados.
 */
export const getDatabaseAdapter = (): DatabaseAdapter => {
  const dbSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'FIRESTORE';
  
  // Se o sistema mudou ou se não há instância, cria uma nova.
  if (dbSystem !== currentDbSystem || !adapterInstance) {
    console.log(`[getDatabaseAdapter] LOG: DB System changed or no instance. Initializing new adapter for: ${dbSystem}`);
    currentDbSystem = dbSystem; // Update the current system
    
    switch (dbSystem) {
      case 'MYSQL':
        adapterInstance = new MySqlAdapter();
        break;
      case 'FIRESTORE':
      default:
        adapterInstance = new FirestoreAdapter();
        break;
    }
     console.log(`[getDatabaseAdapter] LOG: New adapter instance created for ${dbSystem}.`);
  } else {
    console.log(`[getDatabaseAdapter] LOG: Reusing existing adapter instance for ${dbSystem}.`);
  }

  return adapterInstance;
};
