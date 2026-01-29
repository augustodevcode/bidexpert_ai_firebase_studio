/**
 * @fileoverview Testes unitários para seleção de cliente Prisma por subdomínio.
 * @vitest-environment node
 *
 * BDD: Garantir que o subdomínio "demo" selecione o banco demo automaticamente.
 * TDD: Validar seleção explícita de cliente por subdomínio.
 */

import { describe, expect, it, vi } from 'vitest';

describe('Prisma client selection', () => {
  it('seleciona demoPrisma quando subdomínio é demo', async () => {
    vi.resetModules();
    process.env.DATABASE_URL_DEMO = 'mysql://user:pass@localhost:3306/bidexpert_demo';

    const { getPrismaClientBySubdomain, demoPrisma, mainPrisma } = await import('../../src/lib/prisma');
    const client = getPrismaClientBySubdomain('demo');

    expect(client).toBe(demoPrisma ?? mainPrisma);
  });

  it('retorna mainPrisma para subdomínios não demo', async () => {
    vi.resetModules();
    process.env.DATABASE_URL_DEMO = 'mysql://user:pass@localhost:3306/bidexpert_demo';

    const { getPrismaClientBySubdomain, mainPrisma } = await import('../../src/lib/prisma');
    const client = getPrismaClientBySubdomain('bidexpert');

    expect(client).toBe(mainPrisma);
  });

  it('permite seleção explícita via getPrismaInstance', async () => {
    vi.resetModules();
    process.env.DATABASE_URL_DEMO = 'mysql://user:pass@localhost:3306/bidexpert_demo';

    const { getPrismaInstance, demoPrisma, mainPrisma } = await import('../../src/lib/prisma');
    const client = getPrismaInstance('demo');

    expect(client).toBe(demoPrisma ?? mainPrisma);
  });
});
