// src/lib/database/index.ts
/**
 * @fileoverview Este é o principal ponto de entrada para a lógica de banco de dados do lado do servidor.
 */
import { FirestoreAdapter } from './firestore.adapter';
import type { DatabaseAdapter } from '@/types';
import { db } from '@/lib/firebase/admin'; // Import the initialized db instance

/**
 * Retorna uma instância do adaptador de banco de dados Firestore.
 * A lógica para múltiplos bancos de dados foi removida para estabilizar o ambiente.
 * O adaptador é instanciado a cada chamada para garantir que não haja estado compartilhado
 * entre diferentes requisições, mas ele sempre usará a instância singleton do 'db' inicializada.
 * @returns {DatabaseAdapter} Uma instância do adaptador de banco de dados Firestore.
 */
export const getDatabaseAdapter = (): DatabaseAdapter => {
  const dbSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'FIRESTORE';
  
  if (dbSystem !== 'FIRESTORE') {
      console.warn(`[getDatabaseAdapter] WARNING: Environment is set to use '${dbSystem}', but the application has been locked to 'FIRESTORE' for stability. Using FirestoreAdapter.`);
  }

  return new FirestoreAdapter(db);
};
