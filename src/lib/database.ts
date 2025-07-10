// src/lib/database.ts
import 'server-only';
import { FirestoreAdapter } from './database/firestore.adapter';
import { MySqlAdapter } from './database/mysql.adapter';
import { PostgresAdapter } from './database/postgres.adapter';
import { SampleDataAdapter } from './database/sample-data.adapter';
import type { DatabaseAdapter } from '@/types';

/**
 * Dynamically determines which database adapter to use based on environment variables.
 * This function should be called within each Server Action that needs to interact with the database.
 * @returns {Promise<DatabaseAdapter>} A promise that resolves to an instance of the correct database adapter.
 */
export const getDatabaseAdapter = async (): Promise<DatabaseAdapter> => {
  const availableSystems = ['FIRESTORE', 'MYSQL', 'POSTGRES', 'SAMPLE_DATA'];
  
  // A variável de ambiente é a fonte única da verdade.
  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA';

  if (!availableSystems.includes(activeSystem)) {
    console.error(`Invalid database system selected: ${activeSystem}. Falling back to SAMPLE_DATA.`);
    return new SampleDataAdapter();
  }

  // console.log(`[Database] Using adapter for: ${activeSystem}`);

  switch (activeSystem) {
    case 'FIRESTORE':
      return new FirestoreAdapter();
    case 'MYSQL':
      return new MySqlAdapter();
    case 'POSTGRES