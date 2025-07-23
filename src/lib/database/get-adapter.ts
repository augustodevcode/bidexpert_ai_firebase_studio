// src/lib/database/get-adapter.ts
// THIS FILE SHOULD NOT CONTAIN 'use server' or 'use client' and can be used in scripts.
import { FirestoreAdapter } from './firestore.adapter';
import { MySqlAdapter } from './mysql.adapter';
import { PostgresAdapter } from './postgres.adapter';
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
  
  // Se o sistema de banco de dados mudou ou se nenhuma instância foi criada, crie uma nova.
  if (dbSystem !== currentDbSystem || !adapterInstance) {
    console.log(`[getDatabaseAdapter] Mudança de sistema de DB ou primeira execução. Sistema ativo: ${dbSystem}`);
    currentDbSystem = dbSystem;

    switch (dbSystem) {
      case 'MYSQL':
        console.log('[getDatabaseAdapter] Criando nova instância: MySqlAdapter');
        adapterInstance = new MySqlAdapter();
        break;
      case 'POSTGRES':
         console.log('[getDatabaseAdapter] Criando nova instância: PostgresAdapter');
        adapterInstance = new PostgresAdapter();
        break;
      case 'FIRESTORE':
        console.log('[getDatabaseAdapter] Criando nova instância: FirestoreAdapter');
        adapterInstance = new FirestoreAdapter();
        break;
      case 'SAMPLE_DATA':
      default:
        console.log('[getDatabaseAdapter] Criando nova instância: SampleDataAdapter');
        adapterInstance = new SampleDataAdapter();
        break;
    }
  }

  return adapterInstance;
};
