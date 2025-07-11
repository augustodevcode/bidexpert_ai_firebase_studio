// src/lib/database/index.ts

// This file is now primarily a placeholder or could be used for other database-related
// utilities in the future. The project has migrated to using Prisma ORM directly.
// The concept of a "DatabaseAdapter" has been deprecated in favor of the Prisma Client.

// We export the Prisma client instance from a central file to be used across the application.
// This ensures we use a single instance, as recommended by Prisma.

import { prisma } from '@/lib/prisma';

// You can now import `prisma` from `@/lib/database` and use it in your server actions
// and API routes to interact with the database.

// The getDatabaseAdapter function is no longer needed.
// Example:
// import { prisma } from '@/lib/database';
// const users = await prisma.user.findMany();

// For simplicity and to avoid breaking existing import paths that might still point here,
// we can re-export the prisma client.
export { prisma };

// The old adapter logic is maintained below for historical reference but is not used
// if the project is consistently using the Prisma Client.

/*
import 'server-only';
import { FirestoreAdapter } from './firestore.adapter';
import { MySqlAdapter } from './mysql.adapter';
import { PostgresAdapter } from './postgres.adapter';
import { SampleDataAdapter } from './sample-data.adapter';
import type { DatabaseAdapter } from '@/types';

// Mapeia o nome do sistema para a classe do adaptador correspondente.
const adapters: { [key: string]: new () => DatabaseAdapter } = {
  FIRESTORE: FirestoreAdapter,
  MYSQL: MySqlAdapter,
  POSTGRES: PostgresAdapter,
  SAMPLE_DATA: SampleDataAdapter,
};

export const getDatabaseAdapter = (): DatabaseAdapter => {
  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA';

  const AdapterClass = adapters[activeSystem];

  if (!AdapterClass) {
    console.error(`Sistema de banco de dados inválido selecionado: ${activeSystem}. Retornando para SAMPLE_DATA.`);
    return new SampleDataAdapter();
  }

  return new AdapterClass();
};
*/
