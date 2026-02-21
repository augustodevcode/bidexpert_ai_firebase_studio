/**
 * @fileoverview Testes unitários para resolução de tenant em getTenantIdFromRequest.
 * @vitest-environment node
 *
 * BDD: Garantir que o tenant da URL seja respeitado quando o usuário é admin do landlord.
 * TDD: Validar resolução de slug e priorização da sessão de usuários comuns.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockHeaders: new Headers(),
  getSessionMock: vi.fn(),
  findFirstMock: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: () => mocks.mockHeaders,
}));

vi.mock('@/server/lib/session', () => ({
  getSession: mocks.getSessionMock,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: {
      findFirst: mocks.findFirstMock,
    },
  },
}));

describe('getTenantIdFromRequest', () => {
  beforeEach(() => {
    mocks.mockHeaders = new Headers();
    mocks.getSessionMock.mockReset();
    mocks.findFirstMock.mockReset();
    vi.resetModules();
  });

  it('usa o tenant do header quando a sessão é landlord e o header é slug resolvível', async () => {
    mocks.mockHeaders = new Headers({ 'x-tenant-id': 'demo' });
    mocks.getSessionMock.mockResolvedValue({ tenantId: '1' });
    mocks.findFirstMock.mockResolvedValue({ id: BigInt(4) });

    const { getTenantIdFromRequest } = await import('../../src/lib/actions/auth');
    const tenantId = await getTenantIdFromRequest();

    expect(tenantId).toBe('4');
    expect(mocks.findFirstMock).toHaveBeenCalledOnce();
  });

  it('prioriza o tenant da sessão quando não é landlord', async () => {
    mocks.mockHeaders = new Headers({ 'x-tenant-id': 'demo' });
    mocks.getSessionMock.mockResolvedValue({ tenantId: '5' });

    const { getTenantIdFromRequest } = await import('../../src/lib/actions/auth');
    const tenantId = await getTenantIdFromRequest();

    expect(tenantId).toBe('5');
  });

  it('usa o tenant do header numérico quando não há sessão', async () => {
    mocks.mockHeaders = new Headers({ 'x-tenant-id': '2' });
    mocks.getSessionMock.mockResolvedValue(null);

    const { getTenantIdFromRequest } = await import('../../src/lib/actions/auth');
    const tenantId = await getTenantIdFromRequest();

    expect(tenantId).toBe('2');
  });

  it('resolve slug do header quando não há sessão', async () => {
    mocks.mockHeaders = new Headers({ 'x-tenant-id': 'demo' });
    mocks.getSessionMock.mockResolvedValue(undefined);
    mocks.findFirstMock.mockResolvedValue({ id: BigInt(7) });

    const { getTenantIdFromRequest } = await import('../../src/lib/actions/auth');
    const tenantId = await getTenantIdFromRequest();

    expect(tenantId).toBe('7');
  });

  it('faz fallback quando o campo domain não existe no schema', async () => {
    mocks.mockHeaders = new Headers({ 'x-tenant-id': 'demo' });
    mocks.getSessionMock.mockResolvedValue(undefined);
    mocks.findFirstMock
      .mockRejectedValueOnce(new Error('Unknown argument `domain`'))
      .mockResolvedValueOnce({ id: BigInt(9) });

    const { getTenantIdFromRequest } = await import('../../src/lib/actions/auth');
    const tenantId = await getTenantIdFromRequest();

    expect(tenantId).toBe('9');
    expect(mocks.findFirstMock).toHaveBeenCalledTimes(2);
    expect(mocks.findFirstMock.mock.calls[1]?.[0]?.where).toEqual({ subdomain: 'demo' });
  });
});
