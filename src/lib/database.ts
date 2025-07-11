// src/lib/database.ts
import 'server-only';
import { FirestoreAdapter } from './database/firestore.adapter';
import { MySqlAdapter } from './database/mysql.adapter';
import { PostgresAdapter } from './database/postgres.adapter';
import { SampleDataAdapter } from './database/sample-data.adapter';
import type { DatabaseAdapter } from '@/types';

// Mapeia o nome do sistema para a classe do adaptador correspondente.
const adapters: { [key: string]: new () => DatabaseAdapter } = {
  FIRESTORE: FirestoreAdapter,
  MYSQL: MySqlAdapter,
  POSTGRES: PostgresAdapter,
  SAMPLE_DATA: SampleDataAdapter,
};

/**
 * Determina dinamicamente qual adaptador de banco de dados usar com base nas variáveis de ambiente.
 * Esta função deve ser chamada dentro de cada Server Action que precisa interagir com o banco de dados.
 * @returns {DatabaseAdapter} Uma instância do adaptador de banco de dados correto.
 */
export const getDatabaseAdapter = (): DatabaseAdapter => {
  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA';

  const AdapterClass = adapters[activeSystem];

  if (!AdapterClass) {
    console.error(`Sistema de banco de dados inválido selecionado: ${activeSystem}. Retornando para SAMPLE_DATA.`);
    return new SampleDataAdapter();
  }

  return new AdapterClass();
};
