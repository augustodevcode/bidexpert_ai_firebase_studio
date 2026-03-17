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
    // Preserve env vars that may conflict with test-specific overrides
    savedEnv.PRISMA_SCHEMA = process.env.PRISMA_SCHEMA;
    savedEnv.EXPECT_POSTGRESQL = process.env.EXPECT_POSTGRESQL;
    savedEnv.DATABASE_URL = process.env.DATABASE_URL;
    savedEnv.POSTGRES_PRISMA_URL = process.env.POSTGRES_PRISMA_URL;

    // Clear schema expectations so validateDatabaseUrlProtocol()
    // does not reject mysql:// URLs when CI sets PRISMA_SCHEMA to postgresql
    delete process.env.PRISMA_SCHEMA;
    delete process.env.EXPECT_POSTGRESQL;
  });

  afterEach(() => {
    // Restore original env vars
    for (const [key, val] of Object.entries(savedEnv)) {
      if (val === undefined) delete process.env[key];
      else process.env[key] = val;
    }
  });

  it('seleciona demoPrisma quando subdomínio é demo', async () => {
    vi.resetModules();
    process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/bidexpert_dev';
    process.env.POSTGRES_PRISMA_URL = 'postgresql://user:pass@localhost:5432/bidexpert_demo';

    const { getPrismaClientBySubdomain, demoPrisma, mainPrisma } = await import('../../src/lib/prisma');
    const client = getPrismaClientBySubdomain('demo');

    expect(client).toBe(demoPrisma ?? mainPrisma);
  });

  it('retorna mainPrisma para subdomínios não demo', async () => {
    vi.resetModules();
    process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/bidexpert_dev';

    const { getPrismaClientBySubdomain, mainPrisma } = await import('../../src/lib/prisma');
    const client = getPrismaClientBySubdomain('bidexpert');

    expect(client).toBe(mainPrisma);
  });

  it('permite seleção explícita via getPrismaInstance', async () => {
    vi.resetModules();
    process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/bidexpert_dev';
    process.env.POSTGRES_PRISMA_URL = 'postgresql://user:pass@localhost:5432/bidexpert_demo';

    const { getPrismaInstance, demoPrisma, mainPrisma } = await import('../../src/lib/prisma');
    const client = getPrismaInstance('demo');

    expect(client).toBe(demoPrisma ?? mainPrisma);
  });
});
