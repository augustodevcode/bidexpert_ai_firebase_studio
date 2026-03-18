/**
 * @fileoverview Garante que actions administrativas de leilão sanitizam payloads individuais antes do client.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetTenantIdFromRequest = vi.fn();
const mockGetAuctionById = vi.fn();

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

vi.mock('@/lib/actions/auth', () => ({
  getTenantIdFromRequest: mockGetTenantIdFromRequest,
}));

vi.mock('@/services/auction.service', () => ({
  AuctionService: class MockAuctionService {
    getAuctionById = mockGetAuctionById;
    getAuctions = vi.fn();
    createAuction = vi.fn();
    updateAuction = vi.fn();
    deleteAuction = vi.fn();
  },
}));

describe('admin auction actions serialization', () => {
  beforeEach(() => {
    mockGetTenantIdFromRequest.mockReset();
    mockGetAuctionById.mockReset();
    mockGetTenantIdFromRequest.mockResolvedValue('1');
  });

  it('sanitize getAuction response with bigint and dates', async () => {
    mockGetAuctionById.mockResolvedValue({
      id: BigInt(10),
      sellerId: BigInt(22),
      createdAt: new Date('2026-03-18T00:00:00.000Z'),
      auctionStages: [{ id: BigInt(44), endDate: new Date('2026-03-19T00:00:00.000Z') }],
    });

    const { getAuction } = await import('@/app/admin/auctions/actions');
    const result = await getAuction('10');

    expect(result).toEqual({
      id: '10',
      sellerId: '22',
      createdAt: '2026-03-18T00:00:00.000Z',
      auctionStages: [{ id: '44', endDate: '2026-03-19T00:00:00.000Z' }],
    });
    expect(mockGetAuctionById).toHaveBeenCalledWith('1', '10', false);
  });

  it('sanitize getAuctionById response when bigint identifier is provided', async () => {
    mockGetAuctionById.mockResolvedValue({ id: BigInt(91), auctioneerId: BigInt(77) });

    const { getAuctionById } = await import('@/app/admin/auctions/actions');
    const result = await getAuctionById(BigInt(91));

    expect(result).toEqual({ id: '91', auctioneerId: '77' });
    expect(mockGetAuctionById).toHaveBeenCalledWith('1', '91', false);
  });
});