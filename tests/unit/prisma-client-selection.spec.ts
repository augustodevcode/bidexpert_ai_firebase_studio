/**
 * @fileoverview Testes unitários para seleção de cliente Prisma por subdomínio.
 * @vitest-environment node
 *
 * BDD: Garantir que o subdomínio "demo" selecione o banco demo automaticamente.
 * TDD: Validar seleção explícita de cliente por subdomínio.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Prisma client selection', () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    vi.resetModules();

    savedEnv.DATABASE_URL = process.env.DATABASE_URL;
    savedEnv.EXPECT_POSTGRESQL = process.env.EXPECT_POSTGRESQL;
    savedEnv.POSTGRES_PRISMA_URL = process.env.POSTGRES_PRISMA_URL;
    savedEnv.PRISMA_SCHEMA = process.env.PRISMA_SCHEMA;
    savedEnv.USE_SEPARATE_DEMO_DB = process.env.USE_SEPARATE_DEMO_DB;

    process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/bidexpert_dev';
    delete process.env.EXPECT_POSTGRESQL;
    delete process.env.POSTGRES_PRISMA_URL;
    delete process.env.PRISMA_SCHEMA;
    delete process.env.USE_SEPARATE_DEMO_DB;
  });

  afterEach(() => {
    vi.resetModules();

    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
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
