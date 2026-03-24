/**
 * @fileoverview Helpers puros para normalização temporal de leilões, lotes e praças.
 */

import type { Auction, AuctionStage, AuctionStatus, Lot, LotStatus } from '@/types';

type DateLike = Date | string | null | undefined;

type StageLike = Partial<
  Pick<AuctionStage, 'id' | 'name' | 'startDate' | 'endDate' | 'status' | 'discountPercent' | 'initialPrice'>
>;

const TERMINAL_AUCTION_STATUSES = new Set<string>(['ENCERRADO', 'FINALIZADO', 'CANCELADO', 'SUSPENSO']);
const OPENISH_AUCTION_STATUSES = new Set<string>(['ABERTO', 'ABERTO_PARA_LANCES', 'EM_BREVE']);
const TERMINAL_LOT_STATUSES = new Set<string>(['ENCERRADO', 'VENDIDO', 'NAO_VENDIDO', 'RELISTADO', 'CANCELADO', 'RETIRADO']);
const OPENISH_LOT_STATUSES = new Set<string>(['ABERTO_PARA_LANCES', 'EM_BREVE', 'EM_PREGAO']);

export type TemporalStageStatus = 'completed' | 'active' | 'upcoming';

export const toValidDate = (value: DateLike): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toTimestamp = (value: DateLike, fallback: number): number => toValidDate(value)?.getTime() ?? fallback;

export const normalizeAuctionStages = <T extends StageLike>(stages?: readonly T[] | null): T[] => {
  if (!stages?.length) {
    return [];
  }

  return [...stages].sort((left, right) => {
    const startDiff = toTimestamp(left.startDate, Number.MAX_SAFE_INTEGER) - toTimestamp(right.startDate, Number.MAX_SAFE_INTEGER);
    if (startDiff !== 0) {
      return startDiff;
    }

    const endDiff = toTimestamp(left.endDate, Number.MAX_SAFE_INTEGER) - toTimestamp(right.endDate, Number.MAX_SAFE_INTEGER);
    if (endDiff !== 0) {
      return endDiff;
    }

    return String(left.id ?? '').localeCompare(String(right.id ?? ''));
  });
};

export const getAuctionStageChronologyError = (stages?: readonly StageLike[] | null): string | null => {
  const orderedStages = normalizeAuctionStages(stages);

  for (let index = 0; index < orderedStages.length; index += 1) {
    const stage = orderedStages[index];
    const startDate = toValidDate(stage.startDate);
    const endDate = toValidDate(stage.endDate);
    const stageLabel = stage.name || `Etapa ${index + 1}`;

    if (!startDate || !endDate) {
      return `A ${stageLabel} precisa ter datas válidas de início e encerramento.`;
    }

    if (startDate.getTime() > endDate.getTime()) {
      return `A ${stageLabel} não pode encerrar antes de começar.`;
    }

    const previousStage = orderedStages[index - 1];
    const previousEndDate = toValidDate(previousStage?.endDate);
    if (previousEndDate && startDate.getTime() < previousEndDate.getTime()) {
      return `${stageLabel} não pode iniciar antes do término da etapa anterior.`;
    }
  }

  return null;
};

export const getAuctionEffectiveDates = (
  auction?: Pick<Auction, 'actualOpenDate' | 'openDate' | 'auctionDate' | 'endDate' | 'auctionStages'> | null,
): { startDate: Date | null; endDate: Date | null } => {
  const orderedStages = normalizeAuctionStages(auction?.auctionStages);

  return {
    startDate:
      toValidDate(auction?.actualOpenDate) ||
      toValidDate(auction?.openDate) ||
      toValidDate(auction?.auctionDate) ||
      toValidDate(orderedStages[0]?.startDate),
    endDate:
      toValidDate(orderedStages[orderedStages.length - 1]?.endDate) ||
      toValidDate(auction?.endDate),
  };
};

export const getAuctionStageTimelineStatus = (
  stage?: Pick<AuctionStage, 'startDate' | 'endDate'> | null,
  referenceDate = new Date(),
): TemporalStageStatus => {
  const startDate = toValidDate(stage?.startDate);
  const endDate = toValidDate(stage?.endDate);

  if (endDate && referenceDate.getTime() > endDate.getTime()) {
    return 'completed';
  }

  if (
    startDate &&
    referenceDate.getTime() >= startDate.getTime() &&
    (!endDate || referenceDate.getTime() <= endDate.getTime())
  ) {
    return 'active';
  }

  return 'upcoming';
};

export const getLotEffectiveDates = (
  lot: Pick<Lot, 'endDate' | 'auctionDate'>,
  auction?: Pick<Auction, 'actualOpenDate' | 'openDate' | 'auctionDate' | 'endDate' | 'auctionStages'> | null,
  referenceDate = new Date(),
): { effectiveLotStartDate: Date | null; effectiveLotEndDate: Date | null } => {
  const orderedStages = normalizeAuctionStages(auction?.auctionStages);

  if (orderedStages.length > 0) {
    const activeOrNextStage = orderedStages.find((stage) => {
      const endDate = toValidDate(stage.endDate);
      return !!endDate && endDate.getTime() >= referenceDate.getTime();
    });

    if (activeOrNextStage) {
      return {
        effectiveLotStartDate: toValidDate(activeOrNextStage.startDate),
        effectiveLotEndDate: toValidDate(activeOrNextStage.endDate),
      };
    }

    const lastFinishedStage = orderedStages[orderedStages.length - 1];
    if (lastFinishedStage) {
      return {
        effectiveLotStartDate: toValidDate(lastFinishedStage.startDate),
        effectiveLotEndDate: toValidDate(lastFinishedStage.endDate),
      };
    }
  }

  const auctionEffectiveDates = getAuctionEffectiveDates(auction);
  return {
    effectiveLotStartDate: toValidDate(lot.auctionDate) || auctionEffectiveDates.startDate,
    effectiveLotEndDate: toValidDate(lot.endDate) || auctionEffectiveDates.endDate,
  };
};

const deriveTemporalStatus = (
  rawStatus: string | undefined,
  startDate: Date | null,
  endDate: Date | null,
  terminalStatuses: Set<string>,
  openishStatuses: Set<string>,
  openStatus: string,
  upcomingStatus: string,
  referenceDate: Date,
): string | undefined => {
  if (!rawStatus) {
    return rawStatus;
  }

  if (terminalStatuses.has(rawStatus)) {
    return rawStatus;
  }

  if (endDate && referenceDate.getTime() > endDate.getTime()) {
    return 'ENCERRADO';
  }

  if (startDate && referenceDate.getTime() < startDate.getTime() && openishStatuses.has(rawStatus)) {
    return upcomingStatus;
  }

  if ((!startDate || referenceDate.getTime() >= startDate.getTime()) && (!endDate || referenceDate.getTime() <= endDate.getTime()) && openishStatuses.has(rawStatus)) {
    return openStatus;
  }

  return rawStatus;
};

export const getEffectiveAuctionStatus = (
  auction?: Pick<Auction, 'status' | 'actualOpenDate' | 'openDate' | 'auctionDate' | 'endDate' | 'auctionStages'> | null,
  referenceDate = new Date(),
): AuctionStatus | undefined => {
  const { startDate, endDate } = getAuctionEffectiveDates(auction);
  return deriveTemporalStatus(
    auction?.status,
    startDate,
    endDate,
    TERMINAL_AUCTION_STATUSES,
    OPENISH_AUCTION_STATUSES,
    'ABERTO_PARA_LANCES',
    'EM_BREVE',
    referenceDate,
  ) as AuctionStatus | undefined;
};

export const getEffectiveLotStatus = (
  lot?: Pick<Lot, 'status' | 'endDate' | 'auctionDate'> | null,
  auction?: Pick<Auction, 'actualOpenDate' | 'openDate' | 'auctionDate' | 'endDate' | 'auctionStages'> | null,
  referenceDate = new Date(),
): LotStatus | undefined => {
  const { effectiveLotStartDate, effectiveLotEndDate } = getLotEffectiveDates(
    lot || { endDate: null, auctionDate: null },
    auction,
    referenceDate,
  );

  return deriveTemporalStatus(
    lot?.status,
    effectiveLotStartDate,
    effectiveLotEndDate,
    TERMINAL_LOT_STATUSES,
    OPENISH_LOT_STATUSES,
    'ABERTO_PARA_LANCES',
    'EM_BREVE',
    referenceDate,
  ) as LotStatus | undefined;
};