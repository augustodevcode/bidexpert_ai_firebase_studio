/**
 * @fileoverview Testes unitários para seleção de cliente Prisma por subdomínio.
 * @vitest-environment node
 *
 * BDD: Garantir que o subdomínio "demo" selecione o banco demo automaticamente.
 * TDD: Validar seleção explícita de cliente por subdomínio.
 */

import { describe, expect, it, vi } from 'vitest';

const originalEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  EXPECT_POSTGRESQL: process.env.EXPECT_POSTGRESQL,
  POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
  PRISMA_SCHEMA: process.env.PRISMA_SCHEMA,
  USE_SEPARATE_DEMO_DB: process.env.USE_SEPARATE_DEMO_DB,
};

function resetPrismaSelectionEnv() {
  process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/bidexpert_dev';
  delete process.env.EXPECT_POSTGRESQL;
  delete process.env.POSTGRES_PRISMA_URL;
  delete process.env.PRISMA_SCHEMA;
  delete process.env.USE_SEPARATE_DEMO_DB;
}

describe('Prisma client selection', () => {
  beforeEach(() => {
    vi.resetModules();
    resetPrismaSelectionEnv();
  });

  afterEach(() => {
    vi.resetModules();

    if (originalEnv.DATABASE_URL === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalEnv.DATABASE_URL;
    }

    if (originalEnv.EXPECT_POSTGRESQL === undefined) {
      delete process.env.EXPECT_POSTGRESQL;
    } else {
      process.env.EXPECT_POSTGRESQL = originalEnv.EXPECT_POSTGRESQL;
    }

    if (originalEnv.POSTGRES_PRISMA_URL === undefined) {
      delete process.env.POSTGRES_PRISMA_URL;
    } else {
      process.env.POSTGRES_PRISMA_URL = originalEnv.POSTGRES_PRISMA_URL;
    }

    if (originalEnv.PRISMA_SCHEMA === undefined) {
      delete process.env.PRISMA_SCHEMA;
    } else {
      process.env.PRISMA_SCHEMA = originalEnv.PRISMA_SCHEMA;
    }

    if (originalEnv.USE_SEPARATE_DEMO_DB === undefined) {
      delete process.env.USE_SEPARATE_DEMO_DB;
    } else {
      process.env.USE_SEPARATE_DEMO_DB = originalEnv.USE_SEPARATE_DEMO_DB;
    }
  });

  it('seleciona demoPrisma quando subdomínio é demo', async () => {
    process.env.POSTGRES_PRISMA_URL = 'postgresql://user:pass@localhost:5432/bidexpert_demo';

    const { getPrismaClientBySubdomain, demoPrisma, mainPrisma } = await import('../../src/lib/prisma');
    const client = getPrismaClientBySubdomain('demo');

    expect(client).toBe(demoPrisma ?? mainPrisma);
  });

  it('retorna mainPrisma para subdomínios não demo', async () => {
    const { getPrismaClientBySubdomain, mainPrisma } = await import('../../src/lib/prisma');
    const client = getPrismaClientBySubdomain('bidexpert');

    expect(client).toBe(mainPrisma);
  });

  it('permite seleção explícita via getPrismaInstance', async () => {
    process.env.POSTGRES_PRISMA_URL = 'postgresql://user:pass@localhost:5432/bidexpert_demo';

    const { getPrismaInstance, demoPrisma, mainPrisma } = await import('../../src/lib/prisma');
    const client = getPrismaInstance('demo');

    expect(client).toBe(demoPrisma ?? mainPrisma);
  });
});
