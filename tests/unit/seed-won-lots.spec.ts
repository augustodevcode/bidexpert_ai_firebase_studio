/**
 * @fileoverview Testes unitários (BDD/TDD) para seed de lotes arrematados.
 */
import { describe, it, expect, vi } from 'vitest';
import { seedWonLotsWithServices } from '../../scripts/seed-won-lots-lib';

vi.mock('../../src/lib/prisma', () => {
  const prisma = {
    auctioneer: { findFirst: vi.fn().mockResolvedValue({ id: 1n }) },
    seller: { findFirst: vi.fn().mockResolvedValue({ id: 2n }) },
    userDocument: { findMany: vi.fn().mockResolvedValue([{ userId: 10n }]) },
    documentType: { findFirst: vi.fn().mockResolvedValue({ id: 1n }) }
  };

  return { prisma, default: prisma };
});

describe('Seed de lotes arrematados (services)', () => {
  it('deve criar leilão, lote e arremate usando services', async () => {
    const deps = {
      auctionService: { createAuction: vi.fn().mockResolvedValue({ success: true, auctionId: '1' }) },
      lotService: {
        createLot: vi.fn().mockResolvedValue({ success: true, lotId: '1' }),
        updateLot: vi.fn().mockResolvedValue({ success: true, message: 'ok' })
      },
      auctionHabilitationService: { upsertAuctionHabilitation: vi.fn().mockResolvedValue({}) },
      userDocumentService: { createUserDocument: vi.fn().mockResolvedValue({ success: true }) },
      bidderService: {
        getOrCreateBidderProfile: vi.fn().mockResolvedValue({ id: 20n }),
        updateBidderProfile: vi.fn().mockResolvedValue({ success: true }),
        createWonLot: vi.fn().mockResolvedValue({ success: true })
      },
      userService: {
        createUser: vi.fn().mockResolvedValue({ success: true, userId: '10' }),
        updateUserProfile: vi.fn().mockResolvedValue({ success: true })
      },
      documentTypeService: { findByName: vi.fn().mockResolvedValue({ id: 1n }) },
      userWinService: { create: vi.fn().mockResolvedValue({}) },
      auctioneerService: { createAuctioneer: vi.fn().mockResolvedValue({ success: true, auctioneerId: '1' }) },
      sellerService: { createSeller: vi.fn().mockResolvedValue({ success: true, sellerId: '2' }) }
    } as any;

    await seedWonLotsWithServices(1n, { auctionsCount: 1, lotsPerAuction: 1, winnersPerAuction: 1 }, deps);

    expect(deps.auctionService.createAuction).toHaveBeenCalledTimes(1);
    expect(deps.lotService.createLot).toHaveBeenCalledTimes(1);
    expect(deps.lotService.updateLot).toHaveBeenCalledTimes(1);
    expect(deps.auctionHabilitationService.upsertAuctionHabilitation).toHaveBeenCalledTimes(1);
    expect(deps.userWinService.create).toHaveBeenCalledTimes(1);
    expect(deps.bidderService.createWonLot).toHaveBeenCalledTimes(1);
    expect(deps.userService.updateUserProfile).toHaveBeenCalledTimes(1);
    expect(deps.bidderService.updateBidderProfile).toHaveBeenCalledTimes(1);
  });
});
