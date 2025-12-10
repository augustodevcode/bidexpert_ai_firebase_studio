import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * BDD: Garantir que o LotService atualiza lotes usando IDs numéricos ou publicId com segurança.
 * TDD: O teste valida o fluxo happy-path convertendo um publicId real em bigint antes do update.
 */
vi.mock('@/lib/prisma', () => {
  const lotMock = {
    findUnique: vi.fn(),
    update: vi.fn()
  };

  const assetsOnLotsMock = {
    deleteMany: vi.fn(),
    createMany: vi.fn()
  };

  const prismaMock = {
    lot: lotMock,
    assetsOnLots: assetsOnLotsMock,
    $transaction: vi.fn(async (fn: (tx: any) => Promise<void>) => fn(prismaMock))
  };

  return {
    prisma: prismaMock,
    default: prismaMock
  };
});

import { prisma as mockedPrisma } from '@/lib/prisma';
import { LotService } from '@/services/lot.service';

describe('LotService.updateLot', () => {
  beforeEach(() => {
    mockedPrisma.lot.findUnique.mockReset();
    mockedPrisma.lot.update.mockReset();
    mockedPrisma.assetsOnLots.deleteMany.mockReset();
    mockedPrisma.assetsOnLots.createMany.mockReset();
    mockedPrisma.$transaction.mockClear();
  });

  it('resolve publicId before updating lot data', async () => {
    mockedPrisma.lot.findUnique.mockResolvedValueOnce({ id: BigInt(42) });
    mockedPrisma.lot.update.mockResolvedValueOnce({ id: BigInt(42) });

    const service = new LotService();
    const payload = {
      title: 'Atualização via publicId',
      assetIds: ['101', '', '202'],
      tenantId: '7'
    };

    const response = await service.updateLot('lot-public-123', payload);

    expect(response).toEqual({ success: true, message: 'Lote atualizado com sucesso' });
    expect(mockedPrisma.lot.findUnique).toHaveBeenCalledWith({
      where: { publicId: 'lot-public-123' },
      select: { id: true }
    });
    expect(mockedPrisma.lot.update).toHaveBeenCalledWith({
      where: { id: BigInt(42) },
      data: expect.objectContaining({
        title: 'Atualização via publicId'
      })
    });
    expect(mockedPrisma.assetsOnLots.deleteMany).toHaveBeenCalledWith({ where: { lotId: BigInt(42) } });
    expect(mockedPrisma.assetsOnLots.createMany).toHaveBeenCalledWith({
      data: [
        { lotId: BigInt(42), assetId: BigInt(101), tenantId: BigInt(7), assignedBy: 'SYSTEM' },
        { lotId: BigInt(42), assetId: BigInt(202), tenantId: BigInt(7), assignedBy: 'SYSTEM' }
      ]
    });
  });
});
