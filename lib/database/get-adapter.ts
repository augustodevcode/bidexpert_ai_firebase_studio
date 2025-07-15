// src/lib/database/get-adapter.ts
// THIS FILE SHOULD NOT CONTAIN 'use server' or 'use client' and can be used in scripts.
import { FirestoreAdapter } from './firestore.adapter';
// The MySqlAdapter has been removed as it was part of an obsolete data layer strategy.
// import { MySqlAdapter } from './mysql.adapter';
import type { DatabaseAdapter } from '@/types';

let firestoreInstance: DatabaseAdapter | null = null;
// let mysqlInstance: DatabaseAdapter | null = null; // Deprecated

/**
 * Retorna uma instância singleton do adaptador de banco de dados apropriado
 * com base na variável de ambiente NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM.
 * @returns {DatabaseAdapter} Uma instância do adaptador de banco de dados.
 */
export const getDatabaseAdapter = (): DatabaseAdapter => {
  const dbSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'FIRESTORE';
  
  console.log(`[getDatabaseAdapter] Active database system from env: ${dbSystem}`);

  // The application has been standardized on the FirestoreAdapter.
  // The logic for switching to other adapters like MySQL has been removed to ensure stability and a single source of truth.
  if (dbSystem !== 'FIRESTORE') {
    console.warn(`[getDatabaseAdapter] WARNING: Environment is set to use '${dbSystem}', but the application has been locked to 'FIRESTORE' for stability. Using FirestoreAdapter.`);
  }

  // Always return a new instance of the FirestoreAdapter to ensure correct initialization across different contexts.
  // The underlying Firebase Admin SDK manages the singleton connection pool.
  console.log('[getDatabaseAdapter] LOG: Initializing new FirestoreAdapter instance.');
  firestoreInstance = new FirestoreAdapter();
  
  return firestoreInstance;
};
