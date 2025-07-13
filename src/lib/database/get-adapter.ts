// src/lib/database/get-adapter.ts
// THIS FILE SHOULD NOT CONTAIN 'use server' or 'use client' and can be used in scripts.
import { FirestoreAdapter } from './firestore.adapter';
import { MySqlAdapter } from './mysql.adapter';
import { PostgresAdapter } from './postgres.adapter';
import { SampleDataAdapter } from './sample-data.adapter';
import type { DatabaseAdapter } from '@/types';

// Mapeia o nome do sistema para a classe do adaptador correspondente.
const adapters: { [key: string]: { new (): DatabaseAdapter } } = {
  FIRESTORE: FirestoreAdapter,
  MYSQL: MySqlAdapter,
  POSTGRES: PostgresAdapter,
  SAMPLE_DATA: SampleDataAdapter,
};

let adapterInstance: DatabaseAdapter | null = null;
let currentDbSystem: string | null = null;

/**
 * Determina dinamicamente qual adaptador de banco de dados usar com base nas variáveis de ambiente.
 * A instância do adaptador é armazenada em cache para evitar reinicializações desnecessárias.
 * @returns {DatabaseAdapter} Uma instância do adaptador de banco de dados correto.
 */
export const getDatabaseAdapter = (): DatabaseAdapter => {
  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'FIRESTORE';
  console.log(`[getDatabaseAdapter] Active database system from env: ${activeSystem}`);


  // Se o sistema não mudou e já temos uma instância, retorne a instância em cache
  if (adapterInstance && currentDbSystem === activeSystem) {
    return adapterInstance;
  }
  
  // Se o sistema mudou ou não há instância, crie uma nova
  const AdapterClass = adapters[activeSystem];

  if (!AdapterClass) {
    console.error(`[getDatabaseAdapter] Sistema de banco de dados inválido selecionado: ${activeSystem}. Retornando para SAMPLE_DATA.`);
    adapterInstance = new SampleDataAdapter();
  } else {
    console.log(`[getDatabaseAdapter] Usando adaptador: ${AdapterClass.name}`);
    adapterInstance = new AdapterClass();
  }

  currentDbSystem = activeSystem;
  return adapterInstance;
};
