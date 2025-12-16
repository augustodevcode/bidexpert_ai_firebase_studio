// tests/unit/auction.service.spec.ts
/**
 * @fileoverview Garante que AuctionService.updateAuction não envie o campo inexistente `imageUrl` para o Prisma.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuctionService } from '@/services/auction.service';

describe('AuctionService.updateAuction', () => {
  let service: AuctionService;
  let tx: any;

  beforeEach(() => {
    tx = {
      auction: {
        update: vi.fn().mockResolvedValue({}),
      },
      auctionStage: {
        deleteMany: vi.fn().mockResolvedValue(undefined),
        createMany: vi.fn().mockResolvedValue(undefined),
      },
    };

    service = new AuctionService();
    // Sobrescreve dependências internas para evitar acesso ao banco real
    (service as any).auctionRepository = {
      findById: vi.fn().mockResolvedValue({ id: '40', tenantId: '1' }),
    };
    (service as any).prisma = {
      $transaction: (cb: any) => cb(tx),
    };
  });

  it('ignora imageUrl no payload enviado ao Prisma', async () => {
    const result = await service.updateAuction('1', '40', {
      title: 'Leilão Teste',
      imageUrl: 'https://example.com/img.jpg',
      number: '2203',
    });

    expect(tx.auction.update).toHaveBeenCalledOnce();
    const updateArgs = tx.auction.update.mock.calls[0][0];
    expect(updateArgs.data.imageUrl).toBeUndefined();
    expect(result.success).toBe(true);
  });
});
