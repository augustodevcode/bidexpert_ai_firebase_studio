// src/lib/database/get-adapter.ts
// THIS FILE SHOULD NOT CONTAIN 'use server' or 'use client' and can be used in scripts.
import { FirestoreAdapter } from './firestore.adapter';
import { MySqlAdapter } from './mysql.adapter';
import type { DatabaseAdapter } from '@/types';

let firestoreInstance: DatabaseAdapter | null = null;
let mysqlInstance: DatabaseAdapter | null = null;

/**
 * Retorna uma instância singleton do adaptador de banco de dados apropriado
 * com base na variável de ambiente NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM.
 * @returns {DatabaseAdapter} Uma instância do adaptador de banco de dados.
 */
export const getDatabaseAdapter = (): DatabaseAdapter => {
  const dbSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'FIRESTORE';
  
  console.log(`[getDatabaseAdapter] Active database system from env: ${dbSystem}`);

  switch (dbSystem) {
    case 'MYSQL':
      if (!mysqlInstance) {
        console.log('[getDatabaseAdapter] Creating new MySqlAdapter instance.');
        mysqlInstance = new MySqlAdapter();
      }
       console.log('[getDatabaseAdapter] Usando adaptador: MySqlAdapter');
      return mysqlInstance;
    case 'FIRESTORE':
    default:
      if (!firestoreInstance) {
        console.log('[getDatabaseAdapter] Creating new FirestoreAdapter instance.');
        firestoreInstance = new FirestoreAdapter();
      }
       console.log('[getDatabaseAdapter] Usando adaptador: FirestoreAdapter');
      return firestoreInstance;
  }
};
