import { describe, expect, it } from 'vitest';

import { buildLotBidPlanningSummary, getCommissionRatePercent } from '../../src/lib/lot-bid-planning';

describe('lot-bid-planning', () => {
  it('uses tenant commission settings and active stage discount when no bids exist', () => {
    const summary = buildLotBidPlanningSummary({
      lot: {
        price: 2000,
        initialPrice: 2000,
        bidIncrementStep: 500,
        evaluationValue: 4000,
      } as any,
      auction: {
        auctionStages: [
          {
            id: 'stage-1',
            name: '2ª Praça',
            startDate: new Date(Date.now() - 60_000),
            endDate: new Date(Date.now() + 60_000),
            discountPercent: 50,
          },
        ],
      } as any,
      bids: [],
      platformSettings: {
        paymentGatewaySettings: {
          platformCommissionPercentage: 7.5,
        },
      } as any,
    });

    expect(summary.nextBidLabel).toBe('Lance mínimo agora');
    expect(summary.minimumBid).toBe(1000);
    expect(summary.commissionRatePercent).toBe(7.5);
    expect(summary.commissionAmount).toBe(75);
    expect(summary.totalDue).toBe(1075);
    expect(summary.savingsVsEvaluationPercent).toBe(75);
  });

  it('uses the latest bid plus increment when the lot already has bids', () => {
    const summary = buildLotBidPlanningSummary({
      lot: {
        price: 12000,
        initialPrice: 12000,
        bidIncrementStep: 500,
        evaluationValue: 18000,
      } as any,
      auction: {
        auctionStages: [],
      } as any,
      bids: [
        {
          amount: 12500,
          createdAt: new Date('2026-03-31T10:00:00Z'),
        },
        {
          amount: 13000,
          createdAt: new Date('2026-03-31T11:00:00Z'),
        },
      ] as any,
      platformSettings: null,
    });

    expect(summary.nextBidLabel).toBe('Próximo lance aceito');
    expect(summary.minimumBid).toBe(13500);
    expect(summary.commissionRatePercent).toBe(5);
    expect(summary.commissionAmount).toBe(675);
    expect(summary.totalDue).toBe(14175);
    expect(summary.savingsVsEvaluationPercent).toBe(25);
  });

  it('falls back to the default commission rate when settings are missing or invalid', () => {
    expect(getCommissionRatePercent(null)).toBe(5);
    expect(getCommissionRatePercent({ paymentGatewaySettings: { platformCommissionPercentage: 0 } } as any)).toBe(5);
  });
});