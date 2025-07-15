// src/lib/database/index.ts
/**
 * @fileoverview Este é o principal ponto de entrada para a lógica de banco de dados do lado do servidor.
 */
import { FirestoreAdapter } from './firestore.adapter';
import type { DatabaseAdapter } from '@/types';
import { db } from '@/lib/firebase/admin'; // Import the initialized db instance

let adapterInstance: DatabaseAdapter | null = null;

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

  // The adapter can be re-instantiated, but it will receive the same singleton 'db' instance.
  // This is safe and avoids state issues between server actions.
  console.log(`[getDatabaseAdapter] LOG: Providing FirestoreAdapter instance.`);
  adapterInstance = new FirestoreAdapter(db);
  
  return adapterInstance;
};
