/**
 * Service layer for the /lots page V2 card grid.
 * Fetches lots grouped by auction type with all relations
 * needed by the AuctionLotCardV2 component.
 */
import { prisma } from '@/lib/prisma';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  AuctionItem,
  AuctionCategory,
  StageInfo,
  StageStatus,
} from '@/components/cards/auction-lot-card-v2.types';

/* ------------------------------------------------------------------ */
/*  Mapping helpers                                                    */
/* ------------------------------------------------------------------ */

const AUCTION_TYPE_TO_CATEGORY: Record<string, AuctionCategory> = {
  JUDICIAL: 'Judicial',
  EXTRAJUDICIAL: 'Extrajudicial',
  VENDA_DIRETA: 'Venda Direta',
  TOMADA_DE_PRECOS: 'Tomada de Preços',
  PARTICULAR: 'Extrajudicial', // fallback
};

const STAGE_STATUS_MAP: Record<string, StageStatus> = {
  ABERTO: 'Em Andamento',
  EM_ANDAMENTO: 'Em Andamento',
  AGUARDANDO_INICIO: 'Aguardando',
  FECHADO: 'Encerrada',
  CONCLUIDO: 'Encerrada',
  CANCELADO: 'Encerrada',
  SUSPENSO: 'Aguardando',
  DESERTO: 'Encerrada',
  FRUSTRADO: 'Encerrada',
};

/** Visible lot statuses for the public page. */
const VISIBLE_STATUSES = [
  'ABERTO_PARA_LANCES',
  'EM_PREGAO',
  'EM_BREVE',
  'AGUARDANDO',
] as const;

/* ------------------------------------------------------------------ */
/*  Time helpers                                                       */
/* ------------------------------------------------------------------ */

function computeTimeRemaining(endDate: Date | null): string {
  if (!endDate) return 'A definir';
  const now = new Date();
  if (endDate <= now) return 'Encerrado';
  return formatDistanceToNow(endDate, { addSuffix: false, locale: ptBR });
}

/* ------------------------------------------------------------------ */
/*  Image helpers                                                      */
/* ------------------------------------------------------------------ */

function buildImageList(lot: {
  imageUrl?: string | null;
  galleryImageUrls?: unknown;
  CoverImage?: { urlOriginal: string; urlMedium?: string | null } | null;
}): string[] {
  const imgs: string[] = [];

  // 1. CoverImage (relation)
  if (lot.CoverImage?.urlMedium) imgs.push(lot.CoverImage.urlMedium);
  else if (lot.CoverImage?.urlOriginal) imgs.push(lot.CoverImage.urlOriginal);

  // 2. Gallery JSON (array of strings)
  if (Array.isArray(lot.galleryImageUrls)) {
    for (const url of lot.galleryImageUrls) {
      if (typeof url === 'string' && url.length > 0 && !imgs.includes(url)) {
        imgs.push(url);
      }
    }
  }

  // 3. Standalone imageUrl
  if (lot.imageUrl && !imgs.includes(lot.imageUrl)) {
    imgs.push(lot.imageUrl);
  }

  // Fallback placeholder
  if (imgs.length === 0) {
    imgs.push('/images/placeholder-lot.webp');
  }

  return imgs;
}

/* ------------------------------------------------------------------ */
/*  Adapter: Prisma row → AuctionItem                                  */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLotToAuctionItem(lot: any): AuctionItem | null {
  const auction = lot.Auction;
  if (!auction) return null;

  const auctionType = auction.auctionType ?? 'EXTRAJUDICIAL';
  const category: AuctionCategory =
    AUCTION_TYPE_TO_CATEGORY[auctionType] ?? 'Extrajudicial';

  // Stages ordered by startDate
  const stages = (auction.AuctionStage ?? [])
    .slice()
    .sort(
      (a: { startDate: Date }, b: { startDate: Date }) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

  const mapStage = (s: {
    name: string;
    status?: string;
    startDate: Date;
  }): StageInfo => ({
    name: s.name,
    status: STAGE_STATUS_MAP[s.status ?? ''] ?? 'Aguardando',
    date: new Date(s.startDate).toLocaleDateString('pt-BR'),
  });

  const lastStage = stages[stages.length - 1];
  const relevantEndDate = lastStage?.endDate
    ? new Date(lastStage.endDate)
    : lot.endDate
      ? new Date(lot.endDate)
      : null;

  const seller = lot.Seller ?? auction.Seller;

  return {
    id: lot.id.toString(),
    category,
    type: lot.LotCategory?.name ?? 'Geral',
    location: [lot.cityName, lot.stateUf].filter(Boolean).join(', ') || 'Brasil',
    title: lot.title,
    specs: [lot.type, lot.condition].filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    ),
    processNumber: lot.processNumber ?? undefined,
    stats: {
      visits: lot.views ?? 0,
      qualified: auction.totalHabilitatedUsers ?? 0,
      clicks: lot.bidsCount ?? 0, // bidsCount = lances realizados (displayed as "Lances" in card)
    },
    pricing: {
      minimumBid: Number(lot.price),
      evaluation: lot.initialPrice ? Number(lot.initialPrice) : Number(lot.price),
      discountPercentage: lot.discountPercentage ?? undefined,
      increment: lot.bidIncrementStep ? Number(lot.bidIncrementStep) : undefined,
    },
    timeline: {
      stage1: stages[0] ? mapStage(stages[0]) : { name: '1ª Praça', status: 'Aguardando', date: '-' },
      stage2: stages[1] ? mapStage(stages[1]) : undefined,
      timeRemaining: computeTimeRemaining(relevantEndDate),
      endDate: relevantEndDate ? relevantEndDate.toISOString() : undefined,
    },
    images: buildImageList(lot),
    isLive: lot.status === 'EM_PREGAO',
    isOpen: lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'EM_PREGAO',
    comitente: seller
      ? { name: seller.name, logo: seller.logoUrl ?? '', url: seller.website ?? '#' }
      : undefined,
  };
}

/* ------------------------------------------------------------------ */
/*  Main query                                                         */
/* ------------------------------------------------------------------ */

export interface LotCardV2Options {
  tenantId?: bigint;
  limit?: number;
}

export interface GroupedLots {
  judicial: AuctionItem[];
  extrajudicial: AuctionItem[];
  vendaDireta: AuctionItem[];
  tomadaDePrecos: AuctionItem[];
}

export async function getLotsForV2Page(
  options: LotCardV2Options = {},
): Promise<GroupedLots> {
  const { tenantId, limit = 50 } = options;

  const lots = await prisma.lot.findMany({
    where: {
      status: { in: [...VISIBLE_STATUSES] },
      Auction: {
        status: { notIn: ['RASCUNHO', 'EM_PREPARACAO'] },
      },
      ...(tenantId ? { tenantId } : {}),
    },
    include: {
      Auction: {
        include: {
          AuctionStage: { orderBy: { startDate: 'asc' } },
          Seller: true,
        },
      },
      LotCategory: true,
      Seller: true,
      CoverImage: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  const grouped: GroupedLots = {
    judicial: [],
    extrajudicial: [],
    vendaDireta: [],
    tomadaDePrecos: [],
  };

  for (const lot of lots) {
    const item = mapLotToAuctionItem(lot);
    if (!item) continue;

    switch (item.category) {
      case 'Judicial':
        grouped.judicial.push(item);
        break;
      case 'Extrajudicial':
        grouped.extrajudicial.push(item);
        break;
      case 'Venda Direta':
        grouped.vendaDireta.push(item);
        break;
      case 'Tomada de Preços':
        grouped.tomadaDePrecos.push(item);
        break;
    }
  }

  return grouped;
}
