// tests/unit/auction.service.spec.ts
/**
 * @fileoverview Garante validações críticas de AuctionService para payloads de leilão.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuctionService } from '@/services/auction.service';

vi.mock('@/lib/public-id-generator', () => ({
  generatePublicId: vi.fn().mockResolvedValue('auction-public-id-test'),
}));

vi.mock('@/lib/audit-context', () => ({
  createManualAuditLog: vi.fn().mockResolvedValue(undefined),
}));

describe('AuctionService', () => {
  let service: AuctionService;
  let tx: any;
  let mockFindCityById: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFindCityById = vi.fn().mockResolvedValue({ id: 25n, stateId: 1n });
    tx = {
      auction: {
        create: vi.fn().mockResolvedValue({ id: 41n }),
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
      findById: vi.fn().mockResolvedValue({ id: 40n, tenantId: 1n }),
    };
    (service as any).prisma = {
      city: {
        findUnique: mockFindCityById,
      },
      $transaction: (cb: any) => cb(tx),
    };
  });

  describe('createAuction', () => {
    it('falha antes do Prisma quando a praça não informa endDate', async () => {
      const result = await service.createAuction('1', {
        title: 'Leilão Teste',
        auctioneerId: '2',
        sellerId: '3',
        auctionStages: [
          {
            name: 'Praça 1',
            startDate: new Date('2026-04-01T10:00:00.000Z'),
            endDate: undefined as unknown as Date,
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Pra[çc]a 1/i);
      expect(tx.auction.create).not.toHaveBeenCalled();
      expect(tx.auctionStage.createMany).not.toHaveBeenCalled();
    });

    it('persiste praça com endDate explícito', async () => {
      const result = await service.createAuction('1', {
        title: 'Leilão Teste',
        auctioneerId: '2',
        sellerId: '3',
        auctionStages: [
          {
            name: 'Praça 1',
            startDate: new Date('2026-04-01T10:00:00.000Z'),
            endDate: new Date('2026-04-01T12:00:00.000Z'),
            discountPercent: 60,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(tx.auction.create).toHaveBeenCalledOnce();
      expect(tx.auctionStage.createMany).toHaveBeenCalledOnce();

      const createManyArgs = tx.auctionStage.createMany.mock.calls[0][0];
      expect(createManyArgs.data[0].name).toBe('Praça 1');
      expect(createManyArgs.data[0].startDate).toEqual(new Date('2026-04-01T10:00:00.000Z'));
      expect(createManyArgs.data[0].endDate).toEqual(new Date('2026-04-01T12:00:00.000Z'));
    });

    it('falha quando auctioneerId está ausente', async () => {
      const result = await service.createAuction('1', {
        title: 'Leilão Teste',
        sellerId: '3',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('leiloeiro');
      expect(tx.auction.create).not.toHaveBeenCalled();
    });

    it('falha quando sellerId está ausente', async () => {
      const result = await service.createAuction('1', {
        title: 'Leilão Teste',
        auctioneerId: '2',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('comitente');
      expect(tx.auction.create).not.toHaveBeenCalled();
    });

    it('falha quando a cidade não pertence ao estado informado', async () => {
      mockFindCityById.mockResolvedValueOnce({ id: 25n, stateId: 99n });

      const result = await service.createAuction('1', {
        title: 'Leilão Teste',
        auctioneerId: '2',
        sellerId: '3',
        stateId: '1',
        cityId: '25',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('A cidade selecionada não pertence ao estado informado');
      expect(tx.auction.create).not.toHaveBeenCalled();
    });
  });

  describe('updateAuction', () => {
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

    it('persiste modalidades de venda ABA no Auction', async () => {
      const proposalDeadline = new Date('2026-05-06T18:00:00.000Z');
      const result = await service.updateAuction('1', '40', {
        allowSublots: true,
        perLotEnrollmentEnabled: true,
        preferenceRightEnabled: true,
        allowProposals: true,
        directSaleEnabled: true,
        proposalDeadline,
      });

      expect(tx.auction.update).toHaveBeenCalledOnce();
      const updateArgs = tx.auction.update.mock.calls[0][0];
      expect(updateArgs.data.allowSublots).toBe(true);
      expect(updateArgs.data.perLotEnrollmentEnabled).toBe(true);
      expect(updateArgs.data.preferenceRightEnabled).toBe(true);
      expect(updateArgs.data.allowProposals).toBe(true);
      expect(updateArgs.data.directSaleEnabled).toBe(true);
      expect(updateArgs.data.proposalDeadline).toEqual(proposalDeadline);
      expect(result.success).toBe(true);
    });

    it('falha antes de recriar estágios quando endDate está ausente', async () => {
      const result = await service.updateAuction('1', '40', {
        auctionStages: [
          {
            name: 'Praça 1',
            startDate: new Date('2026-04-01T10:00:00.000Z'),
            endDate: undefined as unknown as Date,
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Pra[çc]a 1/i);
      expect(tx.auction.update).not.toHaveBeenCalled();
      expect(tx.auctionStage.deleteMany).not.toHaveBeenCalled();
      expect(tx.auctionStage.createMany).not.toHaveBeenCalled();
    });

    it('falha quando update recebe cidade incompatível com o estado', async () => {
      mockFindCityById.mockResolvedValueOnce({ id: 25n, stateId: 2n });

      const result = await service.updateAuction('1', '40', {
        stateId: '1',
        cityId: '25',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('A cidade selecionada não pertence ao estado informado');
      expect(tx.auction.update).not.toHaveBeenCalled();
    });
  });
});
