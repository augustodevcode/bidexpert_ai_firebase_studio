/**
 * Testes unitários para RN-030: Congruência JP → Ativos → Lote → Leilão
 * Valida que ativos só podem ser vinculados a lotes de leilões do mesmo Processo Judicial.
 * @vitest-environment node
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock prisma — factory não pode referenciar variáveis externas (hoisting)
vi.mock('@/lib/prisma', () => {
  const prismaMock = {
    lot: { findUnique: vi.fn(), findFirst: vi.fn() },
    asset: { findMany: vi.fn(), updateMany: vi.fn() },
    assetsOnLots: { createMany: vi.fn(), findMany: vi.fn() },
    auction: { findUnique: vi.fn() },
    $transaction: vi.fn(async (fn: any) => fn(prismaMock)),
  };
  return { prisma: prismaMock, default: prismaMock };
});

import { prisma as prismaMock } from '@/lib/prisma';
import { LotService } from '@/services/lot.service';

describe('RN-030: Congruência JP no vínculo de Ativos ao Lote', () => {
  let service: LotService;
  const mock = prismaMock as any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LotService();
  });

  // Helper: configurar lot com auction JP
  function setupLotWithAuctionJP(jpId: bigint | null) {
    // lot.findUnique é chamado por:
    // 1. resolveLotInternalId (where: { publicId }) → retorna { id }
    // 2. canModifyLot (where: { id }, include: Auction.status) → retorna lot com status
    // 3. JP congruence check (where: { id }, select: auctionId, Auction.judicialProcessId)
    mock.lot.findUnique.mockImplementation(({ where, select, include }: any) => {
      if (where?.publicId) {
        // resolveLotInternalId
        return Promise.resolve({ id: 100n });
      }
      if (include?.Auction) {
        // canModifyLot
        return Promise.resolve({
          id: 100n,
          status: 'RASCUNHO',
          Auction: { status: 'RASCUNHO', title: 'Leilão Teste' },
        });
      }
      if (select?.auctionId) {
        // JP congruence check
        return Promise.resolve({
          auctionId: 1n,
          Auction: { judicialProcessId: jpId },
        });
      }
      return Promise.resolve(null);
    });
  }

  it('deve permitir vínculo quando ativo pertence ao mesmo JP do leilão', async () => {
    setupLotWithAuctionJP(10n);

    mock.asset.findMany.mockResolvedValue([
      { id: 1n, publicId: 'AST-001', judicialProcessId: 10n, title: 'Ativo 1' },
    ]);
    mock.assetsOnLots.findMany.mockResolvedValue([]);

    const result = await service.linkAssetsToLot('LOT-001', ['1'], '1');
    expect(result.success).toBe(true);
  });

  it('deve bloquear vínculo quando ativo tem JP diferente (CONGRUENCE_JP_MISMATCH)', async () => {
    setupLotWithAuctionJP(10n);

    mock.asset.findMany.mockResolvedValue([
      { id: 1n, publicId: 'AST-001', judicialProcessId: 99n, title: 'Ativo Errado' },
    ]);

    const result = await service.linkAssetsToLot('LOT-001', ['1'], '1');
    expect(result.success).toBe(false);
    expect(result.message).toContain('CONGRUENCE_JP_MISMATCH');
  });

  it('deve bloquear vínculo quando ativo não tem JP em leilão judicial (CONGRUENCE_JP_NULL_ASSET)', async () => {
    setupLotWithAuctionJP(10n);

    mock.asset.findMany.mockResolvedValue([
      { id: 1n, publicId: 'AST-001', judicialProcessId: null, title: 'Ativo Sem JP' },
    ]);

    const result = await service.linkAssetsToLot('LOT-001', ['1'], '1');
    expect(result.success).toBe(false);
    expect(result.message).toContain('CONGRUENCE_JP_NULL_ASSET');
  });

  it('deve bloquear vínculo quando ativo já está em outro lote ativo (ASSET_ALREADY_IN_ACTIVE_LOT)', async () => {
    setupLotWithAuctionJP(10n);

    mock.asset.findMany.mockResolvedValue([
      { id: 1n, publicId: 'AST-001', judicialProcessId: 10n, title: 'Ativo Dup' },
    ]);
    mock.assetsOnLots.findMany.mockResolvedValue([
      {
        Asset: { publicId: 'AST-001', title: 'Ativo Dup' },
        Lot: { publicId: 'LOT-999' },
      },
    ]);

    const result = await service.linkAssetsToLot('LOT-001', ['1'], '1');
    expect(result.success).toBe(false);
    expect(result.message).toContain('ASSET_ALREADY_IN_ACTIVE_LOT');
  });

  it('deve permitir vínculo quando leilão não tem JP (leilão não-judicial)', async () => {
    setupLotWithAuctionJP(null);

    mock.assetsOnLots.findMany.mockResolvedValue([]);

    const result = await service.linkAssetsToLot('LOT-001', ['1'], '1');
    expect(result.success).toBe(true);
  });

  it('deve permitir reuso de ativo de lote encerrado', async () => {
    setupLotWithAuctionJP(10n);

    mock.asset.findMany.mockResolvedValue([
      { id: 1n, publicId: 'AST-001', judicialProcessId: 10n, title: 'Ativo Reuso' },
    ]);
    // assetsOnLots.findMany com filtro notIn ['CANCELADO','ENCERRADO','ARQUIVADO'] retorna vazio
    mock.assetsOnLots.findMany.mockResolvedValue([]);

    const result = await service.linkAssetsToLot('LOT-001', ['1'], '1');
    expect(result.success).toBe(true);
  });
});
