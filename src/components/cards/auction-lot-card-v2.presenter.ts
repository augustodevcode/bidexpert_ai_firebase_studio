/**
 * @fileoverview Presenter compartilhado para adaptar `Lot` + `Auction` ao contrato visual do card V2.
 */
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Auction, AuctionStage, BadgeVisibilitySettings, Lot, PlatformSettings } from '@/types';
import {
  getAuctionStatusText,
  getActiveStage,
  getEffectiveLotEndDate,
  getLotDisplayLocation,
  getLotDisplayPrice,
  isValidImageUrl,
} from '@/lib/ui-helpers';
import { getAuctionStageTimelineStatus, getEffectiveLotStatus } from '@/lib/auction-timing';
import type { AuctionCategory, AuctionItem, StageInfo, StageStatus } from './auction-lot-card-v2.types';

const AUCTION_TYPE_TO_CATEGORY: Record<string, AuctionCategory> = {
  JUDICIAL: 'Judicial',
  EXTRAJUDICIAL: 'Extrajudicial',
  VENDA_DIRETA: 'Venda Direta',
  TOMADA_DE_PRECOS: 'Tomada de Preços',
  PARTICULAR: 'Extrajudicial',
};

const DEFAULT_SEARCH_GRID_BADGES: BadgeVisibilitySettings = {
  showStatusBadge: true,
  showDiscountBadge: true,
  showUrgencyTimer: true,
  showPopularityBadge: true,
  showHotBidBadge: true,
  showExclusiveBadge: true,
};

interface BuildAuctionLotCardV2ItemOptions {
  lot: Lot;
  auction?: Auction;
  platformSettings?: PlatformSettings | null;
  badgeVisibilityConfig?: BadgeVisibilitySettings | null;
  showCountdown?: boolean;
}

function mapStageStatus(stage: AuctionStage): StageStatus {
  const timelineStatus = getAuctionStageTimelineStatus(stage);

  if (timelineStatus === 'active') {
    return 'Em Andamento';
  }

  if (timelineStatus === 'completed') {
    return 'Encerrada';
  }

  return 'Aguardando';
}

function buildStageInfo(stage?: AuctionStage): StageInfo | undefined {
  if (!stage) {
    return undefined;
  }

  return {
    name: stage.name,
    status: mapStageStatus(stage),
    date: new Date(stage.startDate).toLocaleDateString('pt-BR'),
  };
}

function buildImageList(lot: Lot): string[] {
  const images = new Set<string>();

  if (Array.isArray(lot.galleryImageUrls)) {
    for (const imageUrl of lot.galleryImageUrls) {
      if (isValidImageUrl(imageUrl)) {
        images.add(imageUrl);
      }
    }
  }

  if (isValidImageUrl(lot.imageUrl)) {
    images.add(lot.imageUrl as string);
  }

  return images.size > 0 ? Array.from(images) : ['/images/placeholder-lot.webp'];
}

function computeDiscountPercentage(displayValue: number, lot: Lot): number | undefined {
  if (typeof lot.discountPercentage === 'number' && lot.discountPercentage > 0) {
    return Math.round(lot.discountPercentage);
  }

  const evaluationValue = Number(lot.evaluationValue ?? 0);
  if (!Number.isFinite(evaluationValue) || evaluationValue <= 0) {
    return undefined;
  }

  if (!Number.isFinite(displayValue) || displayValue <= 0 || displayValue >= evaluationValue) {
    return undefined;
  }

  return Math.round(((evaluationValue - displayValue) / evaluationValue) * 100);
}

function resolveMentalTriggers(
  lot: Lot,
  effectiveLotStatus: string,
  platformSettings?: PlatformSettings | null,
  badgeVisibilityConfig?: BadgeVisibilitySettings | null,
): string[] {
  const resolvedBadgeConfig = (badgeVisibilityConfig
    ?? platformSettings?.sectionBadgeVisibility?.searchGrid
    ?? DEFAULT_SEARCH_GRID_BADGES) as BadgeVisibilitySettings;
  const triggerSettings = (platformSettings?.mentalTriggerSettings ?? {}) as Record<string, unknown>;
  const triggers = Array.isArray(lot.additionalTriggers) ? [...lot.additionalTriggers] : [];
  const views = lot.views ?? 0;
  const bidsCount = lot.bidsCount ?? 0;
  const popularityThreshold = Number(triggerSettings.popularityViewThreshold ?? 500);
  const hotBidThreshold = Number(triggerSettings.hotBidThreshold ?? 10);

  if (
    resolvedBadgeConfig.showPopularityBadge !== false
    && triggerSettings.showPopularityBadge !== false
    && views > popularityThreshold
  ) {
    triggers.push('MAIS VISITADO');
  }

  if (
    resolvedBadgeConfig.showHotBidBadge !== false
    && triggerSettings.showHotBidBadge !== false
    && bidsCount > hotBidThreshold
    && effectiveLotStatus === 'ABERTO_PARA_LANCES'
  ) {
    triggers.push('LANCE QUENTE');
  }

  if (
    resolvedBadgeConfig.showExclusiveBadge !== false
    && triggerSettings.showExclusiveBadge !== false
    && lot.isExclusive
  ) {
    triggers.push('EXCLUSIVO');
  }

  return Array.from(new Set(triggers.map((trigger) => String(trigger).trim()).filter(Boolean)));
}

export function buildAuctionLotCardV2Item({
  lot,
  auction,
  platformSettings,
  badgeVisibilityConfig,
  showCountdown = true,
}: BuildAuctionLotCardV2ItemOptions): AuctionItem {
  const orderedStages = [...(auction?.auctionStages ?? [])].sort(
    (leftStage, rightStage) => new Date(leftStage.startDate).getTime() - new Date(rightStage.startDate).getTime(),
  );
  const activeStage = getActiveStage(auction?.auctionStages);
  const displayPrice = getLotDisplayPrice(lot, auction);
  const { effectiveLotEndDate } = getEffectiveLotEndDate(lot, auction);
  const effectiveLotStatus = getEffectiveLotStatus(lot as any, auction) ?? lot.status;
  const incrementValue = lot.bidIncrementStep != null ? Number(lot.bidIncrementStep) : undefined;
  const evaluationValue = Number(lot.evaluationValue ?? lot.initialPrice ?? displayPrice.value ?? 0);
  const category = AUCTION_TYPE_TO_CATEGORY[String(auction?.auctionType ?? '')] ?? 'Extrajudicial';
  const sellerSlug = auction?.seller?.slug || auction?.seller?.publicId || auction?.seller?.id;
  const discountPercentage = computeDiscountPercentage(displayPrice.value, lot);
  const mentalTriggers = resolveMentalTriggers(lot, effectiveLotStatus, platformSettings, badgeVisibilityConfig);
  const priceLabel = displayPrice.label;
  const detailAuctionId = auction?.publicId || lot.auctionId;
  const detailLotId = lot.publicId || lot.id;
  const isLive = lot.status === 'EM_PREGAO' || effectiveLotStatus === 'EM_PREGAO';
  const isOpen = effectiveLotStatus === 'ABERTO_PARA_LANCES' || isLive;

  return {
    id: String(lot.id),
    category,
    type: lot.type || lot.categoryName || 'Geral',
    location: getLotDisplayLocation(lot, auction),
    title: lot.title,
    specs: [lot.type, (lot as { condition?: string | null }).condition].filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    ),
    processNumber: lot.judicialProcesses?.[0]?.processNumber ?? undefined,
    stats: {
      visits: lot.views ?? 0,
      qualified: auction?.totalHabilitatedUsers ?? 0,
      clicks: lot.bidsCount ?? 0,
    },
    pricing: {
      minimumBid: displayPrice.value,
      evaluation: evaluationValue > 0 ? evaluationValue : displayPrice.value,
      discountPercentage,
      increment: incrementValue,
    },
    timeline: {
      stage1: buildStageInfo(orderedStages[0]) ?? { name: '1ª Praça', status: 'Aguardando', date: '-' },
      stage2: buildStageInfo(orderedStages[1]),
      timeRemaining: effectiveLotEndDate
        ? formatDistanceToNow(effectiveLotEndDate, { addSuffix: false, locale: ptBR })
        : 'A definir',
      endDate: effectiveLotEndDate?.toISOString(),
    },
    images: buildImageList(lot),
    isLive,
    isOpen,
    comitente: auction?.seller?.name
      ? {
          name: auction.seller.name,
          logo: auction.seller.logoUrl || '/images/placeholder-logo.webp',
          url: sellerSlug ? `/sellers/${sellerSlug}` : '#',
        }
      : undefined,
    detailUrl: `/auctions/${detailAuctionId}/lots/${detailLotId}`,
    lotStatus: effectiveLotStatus,
    statusLabel: getAuctionStatusText(effectiveLotStatus),
    statusTone:
      isOpen
        ? 'open'
        : effectiveLotStatus === 'EM_BREVE'
          ? 'soon'
          : 'closed',
    displayPriceLabel: priceLabel,
    mentalTriggers,
    showOpportunityBadge: Boolean(discountPercentage && discountPercentage >= 40),
    nextBidAmount:
      effectiveLotStatus === 'ABERTO_PARA_LANCES' && incrementValue != null
        ? displayPrice.value + incrementValue
        : undefined,
    sourceLot: lot,
    sourceAuction: auction,
    platformSettings: platformSettings ?? null,
    badgeVisibilityConfig: badgeVisibilityConfig ?? null,
    showCountdown,
  };
}