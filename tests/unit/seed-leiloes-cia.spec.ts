/**
 * @fileoverview Testes unitários (BDD/TDD) para o tenant canônico Leilões e Cia.
 */

import { describe, expect, it, vi } from 'vitest';
import { seedLeiloesCiaTenant } from '../../scripts/seed-leiloes-cia-lib';

describe('seedLeiloesCiaTenant', () => {
  it('cria a cadeia canônica do tenant leiloesecia de forma idempotente', async () => {
    const prisma = {
      tenant: { upsert: vi.fn().mockResolvedValue({ id: 2n, subdomain: 'leiloesecia' }) },
      state: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 33n, uf: 'RJ', name: 'Rio de Janeiro' }),
      },
      city: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 44n, name: 'Rio de Janeiro' }),
      },
      lotCategory: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 55n, name: 'Pesados', slug: 'pesados' }),
      },
      seller: { upsert: vi.fn().mockResolvedValue({ id: 66n }) },
      auctioneer: { upsert: vi.fn().mockResolvedValue({ id: 77n }) },
      auction: { upsert: vi.fn().mockResolvedValue({ id: 88n, slug: 'leiloesecia-mercedes-benz-915e-blinfort-124051' }) },
      auctionStage: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 99n }),
        update: vi.fn().mockResolvedValue({ id: 99n }),
      },
      lot: { upsert: vi.fn().mockResolvedValue({ id: 100n, auctionId: 88n }) },
      asset: { upsert: vi.fn().mockResolvedValue({ id: 101n }) },
      assetsOnLots: { upsert: vi.fn().mockResolvedValue({}) },
      lotStagePrice: { upsert: vi.fn().mockResolvedValue({}) },
      lotDocument: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({}), update: vi.fn().mockResolvedValue({}) },
      lotRisk: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({}), update: vi.fn().mockResolvedValue({}) },
    } as any;

    const result = await seedLeiloesCiaTenant(prisma as any);

    expect(result).toEqual({
      tenantId: 2n,
      auctionId: 88n,
      auctionStageId: 99n,
      lotId: 100n,
      assetId: 101n,
    });

    expect(prisma.tenant.upsert).toHaveBeenCalledOnce();
    expect(prisma.auction.upsert).toHaveBeenCalledOnce();
    expect(prisma.lot.upsert).toHaveBeenCalledOnce();
    expect(prisma.assetsOnLots.upsert).toHaveBeenCalledOnce();
    expect(prisma.lotStagePrice.upsert).toHaveBeenCalledOnce();
    expect(prisma.lotDocument.create).toHaveBeenCalledOnce();
    expect(prisma.lotRisk.create).toHaveBeenCalledOnce();
  });
});