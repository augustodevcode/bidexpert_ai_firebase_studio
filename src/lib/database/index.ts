// src/lib/database/index.ts
/**
 * @fileoverview Este é o principal ponto de entrada para a lógica de banco de dados do lado do servidor.
 */
import { FirestoreAdapter } from './firestore.adapter';
import type { DatabaseAdapter } from '@/types';
import { ensureAdminInitialized } from '@/lib/firebase/admin';

let adapterInstance: DatabaseAdapter | null = null;
const { db } = ensureAdminInitialized(); // Garante a inicialização única e centralizada.

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

  if (!adapterInstance) {
    console.log(`[getDatabaseAdapter] LOG: Creating new FirestoreAdapter instance.`);
    adapterInstance = new FirestoreAdapter(db);
  }
  
  return adapterInstance;
};
