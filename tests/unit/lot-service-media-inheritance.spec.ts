/**
 * @fileoverview Testes unitários para herança opcional de galeria de ativos no LotService.
 * Garante que, quando `inheritedMediaFromAssetId` é informado, o lote persiste mídia
 * derivada do ativo de origem sem depender de campo adicional no schema do lote.
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/public-id-generator', () => ({
  generatePublicId: vi.fn().mockResolvedValue('LOT-TEST-001'),
}));

vi.mock('@/lib/prisma', () => {
  const lotMock = {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  const assetMock = {
    findFirst: vi.fn(),
    updateMany: vi.fn(),
  };

  const assetsOnLotsMock = {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  };

  const txAny = {
    lot: lotMock,
    asset: assetMock,
    assetsOnLots: assetsOnLotsMock,
    lotRisk: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  } as any;

  const prismaMock: any = {
    lot: lotMock,
    asset: assetMock,
    assetsOnLots: assetsOnLotsMock,
    lotRisk: txAny.lotRisk,
    $transaction: vi.fn(async (fn: (tx: any) => Promise<any>) => fn(txAny)),
  };

  return {
    prisma: prismaMock,
    default: prismaMock,
  };
});

import { prisma as mockedPrisma } from '@/lib/prisma';
import { LotService } from '@/services/lot.service';

describe('LotService media inheritance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.assetsOnLots.findMany.mockResolvedValue([]);
    mockedPrisma.assetsOnLots.deleteMany.mockResolvedValue({ count: 0 });
    mockedPrisma.assetsOnLots.createMany.mockResolvedValue({ count: 0 });
    mockedPrisma.lotRisk.deleteMany.mockResolvedValue({ count: 0 });
    mockedPrisma.lotRisk.createMany.mockResolvedValue({ count: 0 });
  });

  it('aplica galeria do ativo ao criar lote quando herança é selecionada', async () => {
    mockedPrisma.asset.findFirst.mockResolvedValue({
      id: 55n,
      tenantId: 7n,
      imageUrl: 'https://cdn.exemplo.com/assets/55-main.jpg',
      imageMediaId: 900n,
      galleryImageUrls: ['https://cdn.exemplo.com/assets/55-gallery-1.jpg'],
      mediaItemIds: ['900', '901'],
      AssetMedia: [
        { mediaItemId: 900n, displayOrder: 0, MediaItem: { urlOriginal: 'https://cdn.exemplo.com/assets/55-gallery-1.jpg' } },
        { mediaItemId: 902n, displayOrder: 1, MediaItem: { urlOriginal: 'https://cdn.exemplo.com/assets/55-gallery-2.jpg' } },
      ],
    });

    mockedPrisma.lot.create.mockResolvedValue({ id: 321n });

    const service = new LotService();
    const result = await service.createLot(
      {
        title: 'Lote de teste com herança',
        auctionId: '11',
        type: 'VEICULO',
        price: 1000,
        inheritedMediaFromAssetId: '55',
      } as any,
      '7'
    );

    expect(result.success).toBe(true);
    expect(mockedPrisma.asset.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 55n, tenantId: 7n }),
      })
    );

    expect(mockedPrisma.lot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          imageUrl: 'https://cdn.exemplo.com/assets/55-main.jpg',
          imageMediaId: 900n,
          galleryImageUrls: [
            'https://cdn.exemplo.com/assets/55-gallery-1.jpg',
            'https://cdn.exemplo.com/assets/55-gallery-2.jpg',
          ],
          mediaItemIds: ['900', '901', '902'],
        }),
      })
    );
  });

  it('atualiza mídia do lote com base no ativo herdado durante update', async () => {
    mockedPrisma.lot.findUnique
      .mockResolvedValueOnce({
        id: 123n,
        status: 'RASCUNHO',
        Auction: { status: 'RASCUNHO', title: 'Leilão Teste' },
      })
      .mockResolvedValueOnce({
        tenantId: 7n,
        status: 'RASCUNHO',
      });

    mockedPrisma.asset.findFirst.mockResolvedValue({
      id: 88n,
      tenantId: 7n,
      imageUrl: null,
      imageMediaId: null,
      galleryImageUrls: ['https://cdn.exemplo.com/assets/88-gallery-1.jpg'],
      mediaItemIds: ['700'],
      AssetMedia: [
        { mediaItemId: 701n, displayOrder: 1, MediaItem: { urlOriginal: 'https://cdn.exemplo.com/assets/88-gallery-2.jpg' } },
      ],
    });

    mockedPrisma.lot.update.mockResolvedValue({ id: 123n });

    const service = new LotService();
    const result = await service.updateLot('123', {
      title: 'Lote Atualizado',
      inheritedMediaFromAssetId: '88',
      assetIds: [],
    } as any);

    expect(result.success).toBe(true);
    expect(mockedPrisma.lot.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 123n },
        data: expect.objectContaining({
          title: 'Lote Atualizado',
          imageUrl: 'https://cdn.exemplo.com/assets/88-gallery-1.jpg',
          galleryImageUrls: [
            'https://cdn.exemplo.com/assets/88-gallery-1.jpg',
            'https://cdn.exemplo.com/assets/88-gallery-2.jpg',
          ],
          mediaItemIds: ['700', '701'],
          CoverImage: { disconnect: true },
        }),
      })
    );
  });
});
