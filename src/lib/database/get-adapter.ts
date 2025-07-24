// src/lib/database/get-adapter.ts
// THIS FILE SHOULD NOT CONTAIN 'use server' or 'use client' and can be used in scripts.
import { MySqlAdapter } from './mysql.adapter';
import type { DatabaseAdapter } from '@/types';

let dbInstance: DatabaseAdapter | null = null;

/**
 * Retorna uma instância singleton do adaptador de banco de dados.
 * Com a migração para o Prisma, este sempre retorna o MySqlAdapter.
 * @returns {DatabaseAdapter} Uma instância do adaptador de banco de dados.
 */
export const getDatabaseAdapter = (): DatabaseAdapter => {
  const dbSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'MYSQL';
  
  console.log(`[getDatabaseAdapter] Active database system from env: ${dbSystem}`);

  if (!dbInstance) {
    console.log('[getDatabaseAdapter] Creating new MySqlAdapter (Prisma) instance.');
    dbInstance = new MySqlAdapter();
  }
  
  return dbInstance;
};
