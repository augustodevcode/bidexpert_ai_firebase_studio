import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => {
    const lotMock = {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn()
    };
  
    const prismaMock = {
      lot: lotMock,
      assetsOnLots: { 
          count: vi.fn(), 
          deleteMany: vi.fn(),
          createMany: vi.fn()
      },
      asset: {
          update: vi.fn()
      },
      $transaction: vi.fn(async (fn) => fn(prismaMock))
    };
  
    return {
      prisma: prismaMock,
      default: prismaMock
    };
  });

import { prisma as mockedPrisma } from '@/lib/prisma';
import { LotService } from '../../src/services/lot.service';

describe('LotService Image Mapping Logic', () => {
    let service: LotService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new LotService();
    });

    it('should map CoverImage.urlOriginal to imageUrl correctly', async () => {
        const mockLot = {
            id: BigInt(1),
            publicId: 'pub-1',
            tenantId: BigInt(1),
            auctionId: BigInt(1),
            title: 'Test Lot',
            description: 'Test Desc',
            status: 'ABERTO',
            CoverImage: {
                id: BigInt(100),
                urlOriginal: 'https://example.com/cover.jpg',
                urlThumbnail: 'https://example.com/cover-thumb.jpg'
            },
            AssetsOnLots: [],
            // Minimal required fields to satisfy mapLotWithDetails logic
            _count: { Bid: 0 },
            LotStagePrice: [],
            JudicialProcess: [],
            LotRisk: [],
            LotDocument: [],
        };

        mockedPrisma.lot.findUnique.mockResolvedValue(mockLot as any);

        const result = await service.findLotById('1', '1');

        expect(result).not.toBeNull();
        expect(result?.imageUrl).toBe('https://example.com/cover.jpg');
    });

    it('should map AssetMedia from AssetsOnLots to galleryImageUrls correctly', async () => {
        const mockLot = {
            id: BigInt(2),
            publicId: 'pub-2',
            tenantId: BigInt(1),
            auctionId: BigInt(1),
            title: 'Gallery Test Lot',
            AssetsOnLots: [
                {
                    Asset: {
                        id: BigInt(50),
                        tenantId: BigInt(1),
                        title: 'Asset 1',
                        AssetMedia: [
                            { 
                                MediaItem: { urlOriginal: 'https://example.com/gallery1.jpg' },
                                displayOrder: 1 
                            },
                            { 
                                MediaItem: { urlOriginal: 'https://example.com/gallery2.jpg' },
                                displayOrder: 2 
                            }
                        ]
                    }
                }
            ],
            // No explicit CoverImage, should default to first gallery image if logic dictates, 
            // or just populate gallery
            CoverImage: null,
            _count: { Bid: 0 },
            LotStagePrice: [],
            JudicialProcess: [],
            LotRisk: [],
            LotDocument: [],
        };

        mockedPrisma.lot.findUnique.mockResolvedValue(mockLot as any);

        const result = await service.findLotById('2', '1');

        expect(result).not.toBeNull();
        expect(result?.galleryImageUrls).toHaveLength(2);
        expect(result?.galleryImageUrls).toContain('https://example.com/gallery1.jpg');
        expect(result?.galleryImageUrls).toContain('https://example.com/gallery2.jpg');
        
        // Check fallback logic: if no cover image, uses first gallery image? 
        // Logic implemented: if (!imageUrl && galleryImageUrls.length > 0) imageUrl = galleryImageUrls[0]
        expect(result?.imageUrl).toBe('https://example.com/gallery1.jpg');
    });

    it('should prioritize CoverImage and avoid asset gallery fallback when main image exists', async () => {
        const mockLot = {
            id: BigInt(3),
            publicId: 'pub-3',
            tenantId: BigInt(1),
            auctionId: BigInt(1),
            CoverImage: {
                urlOriginal: 'https://example.com/cover-main.jpg'
            },
            AssetsOnLots: [
                {
                    Asset: {
                        id: BigInt(60),
                        tenantId: BigInt(1),
                        AssetMedia: [
                            { MediaItem: { urlOriginal: 'https://example.com/gallery-asset.jpg' } }
                        ]
                    }
                }
            ],
            _count: { Bid: 0 },
            LotStagePrice: [],
            JudicialProcess: [],
            LotRisk: [],
            LotDocument: [],
        };

        mockedPrisma.lot.findUnique.mockResolvedValue(mockLot as any);

        const result = await service.findLotById('3', '1');

        expect(result?.imageUrl).toBe('https://example.com/cover-main.jpg');
        expect(result?.galleryImageUrls).toContain('https://example.com/cover-main.jpg');
        expect(result?.galleryImageUrls[0]).toBe('https://example.com/cover-main.jpg');
    });

    it('should serialize imageMediaId as string for the lot form state', async () => {
        const mockLot = {
            id: BigInt(4),
            publicId: 'LOTE-0028',
            tenantId: BigInt(1),
            auctionId: BigInt(1),
            title: 'Lote com mídia principal',
            imageMediaId: BigInt(987654321),
            CoverImage: {
                id: BigInt(987654321),
                urlOriginal: 'https://example.com/cover-media.jpg'
            },
            AssetsOnLots: [],
            _count: { Bid: 0 },
            LotStagePrice: [],
            JudicialProcess: [],
            LotRisk: [],
            LotDocument: [],
        };

        mockedPrisma.lot.findUnique.mockResolvedValue(mockLot as any);

        const result = await service.findLotById('LOTE-0028', '1');

        expect(result?.imageMediaId).toBe('987654321');
        expect(typeof result?.imageMediaId).toBe('string');
    });

    it('should persist imageMediaId through the CoverImage relation when updating a lot', async () => {
        mockedPrisma.lot.findUnique
            .mockResolvedValueOnce({
                id: BigInt(1),
                status: 'EM_BREVE',
                Auction: { status: 'RASCUNHO', title: 'Leilão editável' },
            } as any)
            .mockResolvedValueOnce({ tenantId: BigInt(1), status: 'EM_BREVE' } as any);

        const result = await service.updateLot('1', {
            title: 'Lote com mídia atualizada',
            price: 1000,
            auctionId: '10',
            imageMediaId: '987654321',
        } as any);

        expect(result.success).toBe(true);
        expect(mockedPrisma.lot.update).toHaveBeenCalledTimes(1);

        const updateArgs = mockedPrisma.lot.update.mock.calls[0][0];
        expect(updateArgs.data.imageMediaId).toBeUndefined();
        expect(updateArgs.data.CoverImage).toEqual({ connect: { id: BigInt(987654321) } });
    });
});
