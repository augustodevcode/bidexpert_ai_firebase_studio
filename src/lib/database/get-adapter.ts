// src/lib/database/get-adapter.ts
// THIS FILE SHOULD NOT CONTAIN 'use server' or 'use client' and can be used in scripts.
import { FirestoreAdapter } from './firestore.adapter';
import type { DatabaseAdapter } from '@/types';

let adapterInstance: DatabaseAdapter | null = null;
let currentDbSystem: string | null = null;

/**
 * Retorna uma instância singleton do adaptador de banco de dados Firestore.
 * A lógica para múltiplos bancos de dados foi removida para estabilizar o ambiente.
 * @returns {DatabaseAdapter} Uma instância do adaptador de banco de dados Firestore.
 */
export const getDatabaseAdapter = (): DatabaseAdapter => {
  const dbSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'FIRESTORE';
  
  if (dbSystem !== 'FIRESTORE') {
      console.warn(`[getDatabaseAdapter] WARNING: Environment is set to use '${dbSystem}', but the application has been locked to 'FIRESTORE' for stability. Using FirestoreAdapter.`);
  }

  // Sempre retorna uma nova instância do FirestoreAdapter para garantir a inicialização correta em diferentes contextos (scripts, server actions).
  // O SDK Admin do Firebase gerencia o singleton da conexão subjacente.
  console.log(`[getDatabaseAdapter] LOG: Initializing new FirestoreAdapter instance.`);
  adapterInstance = new FirestoreAdapter();
  
  return adapterInstance;
};
