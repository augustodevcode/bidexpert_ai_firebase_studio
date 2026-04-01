/**
 * @fileoverview Regras derivadas de planejamento do lance para superficies publicas de lote.
 */

import { toMonetaryNumber } from '@/lib/format';
import { calculateMinimumBid, getActiveStage } from '@/lib/ui-helpers';
import type { Auction, AuctionStage, BidInfo, Lot, PlatformSettings } from '@/types';

export interface LotBidPlanningSummary {
  activeStage: AuctionStage | null;
  minimumBid: number;
  bidIncrement: number;
  nextBidLabel: 'Lance mínimo agora' | 'Próximo lance aceito';
  commissionRatePercent: number;
  commissionAmount: number;
  totalDue: number;
  savingsVsEvaluationPercent: number | null;
}

export function getCommissionRatePercent(platformSettings?: PlatformSettings | null): number {
  const configuredRate = toMonetaryNumber(
    platformSettings?.paymentGatewaySettings?.platformCommissionPercentage,
  );

  return configuredRate > 0 ? configuredRate : 5;
}

function getLastBidAmount(bids?: BidInfo[]): number | null {
  if (!bids || bids.length === 0) {
    return null;
  }

  const latestBid = [...bids].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  })[0];

  return latestBid ? toMonetaryNumber(latestBid.amount) : null;
}

export function buildLotBidPlanningSummary(args: {
  lot: Lot;
  auction?: Auction | null;
  bids?: BidInfo[];
  platformSettings?: PlatformSettings | null;
}): LotBidPlanningSummary {
  const { lot, auction, bids = [], platformSettings } = args;
  const activeStage = getActiveStage(auction?.auctionStages);
  const bidIncrement = Math.max(toMonetaryNumber(lot.bidIncrementStep), 0);
  const lastBidAmount = getLastBidAmount(bids);
  const calculatedMinimumBid = calculateMinimumBid(lot, activeStage, bids.length, lastBidAmount);
  const fallbackMinimumBid = toMonetaryNumber(lot.price) || toMonetaryNumber(lot.initialPrice);
  const minimumBid = calculatedMinimumBid > 0 ? calculatedMinimumBid : fallbackMinimumBid;
  const commissionRatePercent = getCommissionRatePercent(platformSettings);
  const commissionAmount = minimumBid * (commissionRatePercent / 100);
  const totalDue = minimumBid + commissionAmount;
  const evaluationValue = toMonetaryNumber(lot.evaluationValue) || toMonetaryNumber(lot.initialPrice);
  const savingsVsEvaluationPercent = evaluationValue > minimumBid && evaluationValue > 0
    ? Math.round(((evaluationValue - minimumBid) / evaluationValue) * 100)
    : null;

  return {
    activeStage,
    minimumBid,
    bidIncrement,
    nextBidLabel: bids.length > 0 ? 'Próximo lance aceito' : 'Lance mínimo agora',
    commissionRatePercent,
    commissionAmount,
    totalDue,
    savingsVsEvaluationPercent,
  };
}