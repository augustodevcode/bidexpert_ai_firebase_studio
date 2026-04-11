/**
 * @fileoverview Garante que o termo de arrematação usa o valor do arremate e reidrata seller/leiloeiro quando necessário.
 */
// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetLotById = vi.fn();
const mockUpdateLot = vi.fn();
const mockGetSellerById = vi.fn();
const mockGetAuctioneerById = vi.fn();
const mockGenerateDocument = vi.fn();
const mockUserWinFindFirst = vi.fn();
const mockUserFindUnique = vi.fn();

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/services/lot.service', () => ({
  LotService: class MockLotService {
    getLotById = mockGetLotById;
    updateLot = mockUpdateLot;
    placeBid = vi.fn();
    placeMaxBid = vi.fn();
    getActiveUserMaxBid = vi.fn();
    getBidHistory = vi.fn();
    getReviews = vi.fn();
    createReview = vi.fn();
    getQuestions = vi.fn();
    createQuestion = vi.fn();
    answerQuestion = vi.fn();
    getLotDetailsForV2 = vi.fn();
    getLotDocuments = vi.fn();
  },
}));

vi.mock('@/services/seller.service', () => ({
  SellerService: class MockSellerService {
    getSellerById = mockGetSellerById;
    getSellerBySlug = vi.fn();
  },
}));

vi.mock('@/services/auctioneer.service', () => ({
  AuctioneerService: class MockAuctioneerService {
    getAuctioneerById = mockGetAuctioneerById;
  },
}));

vi.mock('@/ai/flows/generate-document-flow', () => ({
  generateDocument: mockGenerateDocument,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userWin: {
      findFirst: mockUserWinFindFirst,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
  },
}));

describe('generateWinningBidTermAction', () => {
  beforeEach(() => {
    mockGetLotById.mockReset();
    mockUpdateLot.mockReset();
    mockGetSellerById.mockReset();
    mockGetAuctioneerById.mockReset();
    mockGenerateDocument.mockReset();
    mockUserWinFindFirst.mockReset();
    mockUserFindUnique.mockReset();
  });

  it('usa winningBidAmount e reidrata seller/leiloeiro antes de gerar o PDF', async () => {
    mockGetLotById.mockResolvedValueOnce({
      id: '66',
      tenantId: '1',
      winnerId: '7',
      price: 120000,
      auction: {
        id: '27',
        tenantId: '1',
        title: 'Leilão Demo',
        sellerId: '9',
        auctioneerId: '10',
        seller: null,
        auctioneer: null,
      },
    });
    mockUserWinFindFirst.mockResolvedValueOnce({
      userId: BigInt(7),
      winningBidAmount: '156000.75',
    });
    mockUserFindUnique.mockResolvedValueOnce({ id: BigInt(7), name: 'Analista Demo' });
    mockGetSellerById.mockResolvedValueOnce({ id: '9', name: 'Seller Demo' });
    mockGetAuctioneerById.mockResolvedValueOnce({ id: '10', name: 'Leiloeiro Demo' });
    mockGenerateDocument.mockResolvedValueOnce({
      pdfBase64: 'ZmlsZQ==',
      fileName: 'termo-arrematacao-66.pdf',
    });

    const { generateWinningBidTermAction } = await import('@/app/auctions/[auctionId]/lots/[lotId]/actions');
    const result = await generateWinningBidTermAction('66');

    expect(mockGetSellerById).toHaveBeenCalledWith('1', '9');
    expect(mockGetAuctioneerById).toHaveBeenCalledWith('1', '10');
    expect(mockGenerateDocument).toHaveBeenCalledWith(expect.objectContaining({
      documentType: 'WINNING_BID_TERM',
      data: expect.objectContaining({
        lot: expect.objectContaining({
          id: '66',
          price: 156000.75,
        }),
        seller: { id: '9', name: 'Seller Demo' },
        auctioneer: { id: '10', name: 'Leiloeiro Demo' },
      }),
    }));
    expect(mockUpdateLot).toHaveBeenCalledWith('66', { winningBidTermUrl: '/termo-arrematacao-66.pdf' });
    expect(result).toEqual(expect.objectContaining({
      success: true,
      fileName: 'termo-arrematacao-66.pdf',
    }));
  });
});