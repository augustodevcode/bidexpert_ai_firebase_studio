/**
 * @fileoverview Validates admin global search mapping, tenant scoping, and destination URLs.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAuctionFindMany = vi.fn();
const mockLotFindMany = vi.fn();
const mockUserFindMany = vi.fn();
const mockGetTenantIdFromRequest = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    auction: { findMany: mockAuctionFindMany },
    lot: { findMany: mockLotFindMany },
    user: { findMany: mockUserFindMany },
  },
}));

vi.mock('@/lib/actions/auth', () => ({
  getTenantIdFromRequest: mockGetTenantIdFromRequest,
}));

describe('globalSearch action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTenantIdFromRequest.mockResolvedValue('7');
    mockAuctionFindMany.mockResolvedValue([]);
    mockLotFindMany.mockResolvedValue([]);
    mockUserFindMany.mockResolvedValue([]);
  });

  it('returns empty and skips database calls for short query terms', async () => {
    const { globalSearch } = await import('@/app/actions/global-search');
    const result = await globalSearch('a');

    expect(result).toEqual([]);
    expect(mockGetTenantIdFromRequest).not.toHaveBeenCalled();
    expect(mockAuctionFindMany).not.toHaveBeenCalled();
    expect(mockLotFindMany).not.toHaveBeenCalled();
    expect(mockUserFindMany).not.toHaveBeenCalled();
  });

  it('returns tenant-scoped auction, lot and user results with valid destination URLs', async () => {
    mockAuctionFindMany.mockResolvedValue([
      {
        id: BigInt(10),
        publicId: 'AUC-2026-0001',
        title: 'Leilao Judicial Centro',
        status: 'RASCUNHO',
      },
    ]);

    mockLotFindMany.mockResolvedValue([
      {
        id: BigInt(20),
        publicId: 'LOTE-0100',
        title: 'Apartamento 2 quartos',
        number: '100',
        status: 'ABERTO_PARA_LANCES',
      },
    ]);

    mockUserFindMany.mockResolvedValue([
      {
        id: BigInt(30),
        fullName: 'Admin BidExpert',
        email: 'admin@bidexpert.com.br',
      },
    ]);

    const { globalSearch } = await import('@/app/actions/global-search');
    const result = await globalSearch('AUC-2026');

    expect(result).toHaveLength(3);

    const auctionResult = result.find((item) => item.type === 'auction');
    const lotResult = result.find((item) => item.type === 'lot');
    const userResult = result.find((item) => item.type === 'user');

    expect(auctionResult).toMatchObject({
      id: '10',
      title: 'Leilao Judicial Centro',
      url: '/admin/auctions/AUC-2026-0001/edit',
    });

    expect(lotResult).toMatchObject({
      id: '20',
      title: 'Apartamento 2 quartos',
      url: '/admin/lots/LOTE-0100/edit',
    });

    expect(userResult).toMatchObject({
      id: '30',
      title: 'Admin BidExpert',
      url: '/admin-plus/users/30',
    });

    expect(mockGetTenantIdFromRequest).toHaveBeenCalledWith(false);

    const auctionArgs = mockAuctionFindMany.mock.calls[0][0];
    const lotArgs = mockLotFindMany.mock.calls[0][0];
    const userArgs = mockUserFindMany.mock.calls[0][0];

    expect(auctionArgs.where.tenantId).toBe(BigInt(7));
    expect(lotArgs.where.tenantId).toBe(BigInt(7));
    expect(userArgs.where.UsersOnTenants.some.tenantId).toBe(BigInt(7));
  });
});
