/**
 * @fileoverview Garante a normalização do contrato de UserWin para checkout e pós-arremate.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreate = vi.fn();
const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userWin: {
      create: mockCreate,
      findFirst: mockFindFirst,
      findUnique: mockFindUnique,
      findMany: mockFindMany,
    },
  },
}));

describe('UserWinRepository', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockFindFirst.mockReset();
    mockFindUnique.mockReset();
    mockFindMany.mockReset();
  });

  it('normaliza relações Prisma em findByIdWithDetails para o contrato usado no checkout', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: BigInt(27),
      tenantId: BigInt(1),
      userId: BigInt(7),
      lotId: BigInt(66),
      winningBidAmount: '156000.75',
      paymentStatus: 'PAGO',
      Lot: {
        id: BigInt(66),
        tenantId: BigInt(1),
        auctionId: BigInt(27),
        winnerId: BigInt(7),
        sellerId: BigInt(9),
        auctioneerId: BigInt(10),
        categoryId: BigInt(2),
        cityId: BigInt(3),
        stateId: BigInt(4),
        price: '156000.75',
        initialPrice: '100000.00',
        secondInitialPrice: null,
        bidIncrementStep: '500.00',
        title: 'Lote de teste',
        Auction: {
          id: BigInt(27),
          tenantId: BigInt(1),
          sellerId: BigInt(9),
          auctioneerId: BigInt(10),
          title: 'Leilão Demo',
        },
      },
    });

    const { UserWinRepository } = await import('@/repositories/user-win.repository');
    const repository = new UserWinRepository();
    const result = await repository.findByIdWithDetails('27');

    expect(result).toMatchObject({
      id: '27',
      tenantId: '1',
      userId: '7',
      lotId: '66',
      winningBidAmount: 156000.75,
      lot: {
        id: '66',
        auctionId: '27',
        price: 156000.75,
        initialPrice: 100000,
        bidIncrementStep: 500,
        auctionName: 'Leilão Demo',
        auction: {
          id: '27',
          sellerId: '9',
          auctioneerId: '10',
          title: 'Leilão Demo',
        },
      },
    });
    expect(result).not.toHaveProperty('Lot');
  });
});