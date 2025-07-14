// src/lib/database/get-adapter.ts
// THIS FILE SHOULD NOT CONTAIN 'use server' or 'use client' and can be used in scripts.
import { FirestoreAdapter } from './firestore.adapter';
import { MySqlAdapter } from './mysql.adapter';
import type { DatabaseAdapter } from '@/types';

let adapterInstance: DatabaseAdapter | null = null;

/**
 * Retorna uma instância singleton do adaptador de banco de dados apropriado
 * com base na variável de ambiente NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM.
 * @returns {DatabaseAdapter} Uma instância do adaptador de banco de dados.
 */
export const getDatabaseAdapter = (): DatabaseAdapter => {
  const dbSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'FIRESTORE';
  
  if (adapterInstance) {
    // Se a instância já existe e o sistema não mudou, retorne-a.
    // Esta verificação é um pouco simplista, mas ajuda a evitar recriações desnecessárias.
    if ((dbSystem === 'MYSQL' && adapterInstance instanceof MySqlAdapter) || (dbSystem === 'FIRESTORE' && adapterInstance instanceof FirestoreAdapter)) {
      return adapterInstance;
    }
  }

  console.log(`[getDatabaseAdapter] Initializing new adapter for: ${dbSystem}`);

  switch (dbSystem) {
    case 'MYSQL':
      adapterInstance = new MySqlAdapter();
      console.log('[getDatabaseAdapter] Usando adaptador: MySqlAdapter');
      return adapterInstance;
    case 'FIRESTORE':
    default:
      adapterInstance = new FirestoreAdapter();
      console.log('[getDatabaseAdapter] Usando adaptador: FirestoreAdapter');
      return adapterInstance;
  }
};
