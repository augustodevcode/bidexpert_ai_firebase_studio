// src/lib/database/get-adapter.ts
// THIS FILE SHOULD NOT CONTAIN 'use server' or 'use client' and can be used in scripts.
import { MySqlAdapter } from './mysql.adapter';
import type { DatabaseAdapter } from '@/types';

let mysqlInstance: DatabaseAdapter | null = null;

/**
 * Retorna uma instância singleton do adaptador de banco de dados apropriado
 * com base na variável de ambiente NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM.
 * @returns {DatabaseAdapter} Uma instância do adaptador de banco de dados.
 */
export const getDatabaseAdapter = (): DatabaseAdapter => {
  // Com a migração completa, apenas o MySQL (via Prisma) é suportado.
  // A lógica do switch é mantida para possível expansão futura.
  const dbSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'MYSQL';
  
  console.log(`[getDatabaseAdapter] Active database system from env: ${dbSystem}`);

  switch (dbSystem) {
    case 'MYSQL':
    case 'POSTGRES':
    default:
      if (!mysqlInstance) {
        console.log('[getDatabaseAdapter] Creating new MySqlAdapter instance.');
        mysqlInstance = new MySqlAdapter();
      }
       console.log('[getDatabaseAdapter] Usando adaptador: MySqlAdapter (Prisma)');
      return mysqlInstance;
  }
};
