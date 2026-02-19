import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BidService } from '@/services/bid.service';

describe('BidService', () => {
  let service: BidService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn().mockImplementation((data) => Promise.resolve({ ...data, id: 100n, timestamp: new Date() })),
    };
    service = new BidService();
    (service as any).repository = mockRepository;

    // Mock bidEventEmitter
    vi.mock('@/services/realtime-bids.service', () => ({
      bidEventEmitter: {
        emitBid: vi.fn(),
      },
    }));
  });

  it('deve criar um lance válido', async () => {
    const bidData = {
      amount: 1500,
      lotId: 1n,
      bidderId: 1n,
      tenantId: 1n,
      auctionId: 1n,
    } as any;

    const result = await service.createBid(bidData);
    expect(Number(result.amount)).toBe(1500);
    expect(mockRepository.create).toHaveBeenCalled();
  });

  it('deve falhar se o valor do lance for negativo', async () => {
    const bidData = {
      amount: -100,
      lotId: 1n,
      bidderId: 1n,
    } as any;

    await expect(service.createBid(bidData)).rejects.toThrow('Validação de lance falhou');
  });

  it('deve falhar se o valor do lance exceder o limite', async () => {
    const bidData = {
      amount: 1000000000,
      lotId: 1n,
      bidderId: 1n,
    } as any;

    await expect(service.createBid(bidData)).rejects.toThrow('Validação de lance falhou');
  });
});
