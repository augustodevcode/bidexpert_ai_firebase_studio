/**
 * @file Segment Home V2 Page Data Fetching
 * @description Utility functions to fetch data for segment landing pages
 * including events, lots, partners, and deals of the day.
 */

import { prisma } from '@/lib/prisma';
import { insensitiveContains } from '@/lib/prisma/query-helpers';
import type {
  FeaturedEvent,
  LotCardData,
  PartnerData,
  DealOfTheDay,
  LotBadge,
  SegmentType
} from './types';

// Map segment to database category patterns (must include both singular and plural/exact forms)
const SEGMENT_CATEGORY_PATTERNS: Record<SegmentType, string[]> = {
  veiculos: ['veículo', 'veiculo', 'veículos', 'veiculos', 'carro', 'moto', 'caminhão', 'caminhao', 'ônibus', 'onibus', 'automóvel', 'automovel'],
  imoveis: ['imóvel', 'imovel', 'imóveis', 'imoveis', 'casa', 'apartamento', 'terreno', 'sala', 'galpão', 'galpao', 'loja'],
  maquinas: ['máquina', 'maquina', 'máquinas', 'maquinas', 'maquinário', 'maquinario', 'equipamento', 'trator', 'escavadeira', 'empilhadeira', 'industrial', 'mobiliário', 'mobiliario'],
  tecnologia: ['eletrônico', 'eletronico', 'eletrônicos', 'eletronicos', 'informática', 'informatica', 'computador', 'notebook', 'celular', 'servidor'],
};

function getLotBadges(lot: {
  status: string;
  allowInstallmentBids?: boolean | null;
  isFeatured?: boolean | null;
  endDate?: Date | null;
}): LotBadge[] {
  const badges: LotBadge[] = [];

  if (lot.status === 'ABERTO_PARA_LANCES') {
    badges.push({ type: 'ABERTO', label: 'Aberto', variant: 'default' });
  } else if (lot.status === 'VENDIDO') {
    badges.push({ type: 'VENDIDO', label: 'Vendido', variant: 'outline' });
  } else if (lot.status === 'EM_PROPOSTA') {
    badges.push({ type: 'EM_PROPOSTA', label: 'Em Proposta', variant: 'secondary' });
  } else if (lot.status === 'CONDICIONAL') {
    badges.push({ type: 'CONDICIONAL', label: 'Condicional', variant: 'secondary' });
  }

  if (lot.allowInstallmentBids) {
    badges.push({ type: 'FINANCIAVEL', label: 'Financiável', variant: 'secondary' });
  }

  if (lot.isFeatured) {
    badges.push({ type: 'DESTAQUE', label: 'Destaque', variant: 'default' });
  }

  // Check if ending soon (within 24 hours)
  if (lot.endDate) {
    const hoursUntilEnd = (new Date(lot.endDate).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilEnd > 0 && hoursUntilEnd < 24) {
      badges.push({ type: 'URGENTE', label: 'Urgente', variant: 'destructive' });
    }
  }

  return badges;
}

export async function getSegmentEvents(
  segment: SegmentType,
  limit: number = 12
): Promise<FeaturedEvent[]> {
  try {
    const patterns = SEGMENT_CATEGORY_PATTERNS[segment];

    const whereClause = {
      status: {
        in: ['ABERTO_PARA_LANCES', 'EM_BREVE', 'ABERTO'],
      },
      OR: patterns.flatMap(pattern => [
        { title: insensitiveContains(pattern) },
        { LotCategory: { name: insensitiveContains(pattern) } },
        { Lot: { some: { LotCategory: { name: insensitiveContains(pattern) } } } },
      ]),
    };

    const auctions = await prisma.auction.findMany({
      where: whereClause,
      include: {
        Seller: true,
        Auctioneer: true,
        _count: {
          select: { Lot: true },
        },
      },
      orderBy: { auctionDate: 'asc' },
      take: limit,
    });

    return auctions.map((auction) => ({
      id: auction.id.toString(),
      title: auction.title,
      consignor: (auction as any).Seller?.name || (auction as any).seller?.name || (auction as any).Auctioneer?.name || (auction as any).auctioneer?.name || 'BidExpert',
      consignorLogo: (auction as any).Seller?.logoUrl || (auction as any).seller?.logoUrl || (auction as any).Auctioneer?.logoUrl || (auction as any).auctioneer?.logoUrl || undefined,
      eventType: mapAuctionTypeToEventType(auction.auctionType),
      startDate: auction.auctionDate || new Date(),
      endDate: auction.endDate || new Date(),
      status: mapAuctionStatusToEventStatus(auction.status),
      lotsCount: (auction._count as any).Lot ?? (auction._count as any).lots ?? 0,
      imageUrl: (auction as any).Seller?.logoUrl || (auction as any).seller?.logoUrl || undefined,
      location: auction.address || undefined,
    }));
  } catch (error) {
    console.error('Error fetching segment events:', error);
    return [];
  }
}

export async function getSegmentLots(
  segment: SegmentType,
  limit: number = 12
): Promise<any[]> {
  try {
    const patterns = SEGMENT_CATEGORY_PATTERNS[segment];

    const lots = await prisma.lot.findMany({
      where: {
        status: {
          in: ['ABERTO_PARA_LANCES', 'EM_BREVE'],
        },
        OR: patterns.flatMap(pattern => [
          { title: insensitiveContains(pattern) },
          { LotCategory: { name: insensitiveContains(pattern) } },
          { type: insensitiveContains(pattern) },
        ]),
      },
      include: {
        LotCategory: true,
        Auction: {
          include: {
            Seller: true,
            Auctioneer: true,
            AuctionStage: true,
          }
        },
        LotStagePrice: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { endDate: 'asc' },
      ],
      take: limit,
    });

    // Explicitly pick fields to avoid BigInt/Decimal serialization issues in RSC
    return lots.map(lot => {
      const auction = lot.Auction ? {
        id: lot.Auction.id.toString(),
        publicId: (lot.Auction as any).publicId || null,
        title: lot.Auction.title,
        auctionType: (lot.Auction as any).auctionType || null,
        auctionDate: lot.Auction.auctionDate,
        endDate: (lot.Auction as any).endDate || null,
        status: lot.Auction.status,
        tenantId: lot.Auction.tenantId.toString(),
        seller: lot.Auction.Seller ? {
          id: lot.Auction.Seller.id.toString(),
          name: lot.Auction.Seller.name,
          slug: (lot.Auction.Seller as any).slug || null,
          publicId: (lot.Auction.Seller as any).publicId || null,
          logoUrl: lot.Auction.Seller.logoUrl || null,
          dataAiHintLogo: (lot.Auction.Seller as any).dataAiHintLogo || null,
        } : null,
        auctioneer: lot.Auction.Auctioneer ? {
          id: lot.Auction.Auctioneer.id.toString(),
          name: lot.Auction.Auctioneer.name,
        } : null,
        auctionStages: (lot.Auction.AuctionStage || []).map((stage: any) => ({
          id: stage.id.toString(),
          name: stage.name,
          startDate: stage.startDate,
          endDate: stage.endDate,
          auctionId: stage.auctionId.toString(),
          status: stage.status,
          discountPercent: stage.discountPercent ? Number(stage.discountPercent) : 100,
          tenantId: stage.tenantId.toString(),
        })),
      } : null;

      const lotPrices = (lot.LotStagePrice || []).map((lsp: any) => ({
        id: lsp.id.toString(),
        lotId: lsp.lotId.toString(),
        auctionId: lsp.auctionId.toString(),
        auctionStageId: lsp.auctionStageId.toString(),
        initialBid: lsp.initialBid ? Number(lsp.initialBid) : null,
        bidIncrement: lsp.bidIncrement ? Number(lsp.bidIncrement) : null,
        tenantId: lsp.tenantId.toString(),
      }));

      return {
        id: lot.id.toString(),
        publicId: (lot as any).publicId || null,
        auctionId: lot.auctionId.toString(),
        number: lot.number || null,
        title: lot.title,
        description: lot.description || null,
        slug: (lot as any).slug || null,
        status: lot.status,
        type: lot.type,
        condition: lot.condition || null,
        imageUrl: lot.imageUrl || null,
        galleryImageUrls: (lot as any).galleryImageUrls || null,
        dataAiHint: lot.dataAiHint || null,
        endDate: lot.endDate || null,
        lotSpecificAuctionDate: (lot as any).lotSpecificAuctionDate || null,
        secondAuctionDate: (lot as any).secondAuctionDate || null,
        cityName: lot.cityName || null,
        stateUf: lot.stateUf || null,
        mapAddress: (lot as any).mapAddress || null,
        bidsCount: lot.bidsCount || 0,
        views: lot.views || 0,
        isFeatured: lot.isFeatured || false,
        isExclusive: lot.isExclusive || false,
        discountPercentage: lot.discountPercentage || null,
        additionalTriggers: (lot as any).additionalTriggers || null,
        allowInstallmentBids: lot.allowInstallmentBids || false,
        // Decimal → number
        price: Number(lot.price),
        initialPrice: lot.initialPrice ? Number(lot.initialPrice) : null,
        secondInitialPrice: (lot as any).secondInitialPrice ? Number((lot as any).secondInitialPrice) : null,
        bidIncrementStep: lot.bidIncrementStep ? Number(lot.bidIncrementStep) : null,
        evaluationValue: (lot as any).evaluationValue ? Number((lot as any).evaluationValue) : null,
        soldPrice: (lot as any).soldPrice ? Number((lot as any).soldPrice) : null,
        depositGuaranteeAmount: (lot as any).depositGuaranteeAmount ? Number((lot as any).depositGuaranteeAmount) : null,
        // BigInt FK → string
        categoryId: lot.categoryId?.toString() || null,
        subcategoryId: (lot as any).subcategoryId?.toString() || null,
        sellerId: lot.sellerId?.toString() || null,
        auctioneerId: lot.auctioneerId?.toString() || null,
        cityId: lot.cityId?.toString() || null,
        stateId: lot.stateId?.toString() || null,
        winnerId: lot.winnerId?.toString() || null,
        tenantId: lot.tenantId.toString(),
        // Derived
        categoryName: lot.LotCategory?.name || undefined,
        sellerName: lot.Auction?.Seller?.name || lot.Auction?.Auctioneer?.name || undefined,
        auctionName: lot.Auction?.title || undefined,
        // Nested (safely serialized)
        auction,
        lotPrices,
        badges: getLotBadges(lot),
      };
    });
  } catch (error) {
    console.error('Error fetching segment lots:', error);
    return [];
  }
}

export async function getSegmentPartners(
  segment: SegmentType,
  limit: number = 10
): Promise<PartnerData[]> {
  try {
    const sellers = await prisma.seller.findMany({
      orderBy: { name: 'asc' },
      take: limit,
    });

    return sellers.map((seller) => ({
      id: seller.id.toString(),
      name: seller.name,
      logoUrl: seller.logoUrl || '',
      type: mapSellerTypeToPartnerType((seller as any).sellerType || ((seller as any).isJudicial ? 'GOVERNO' : null)),
      href: `/sellers/${(seller as any).slug || (seller as any).publicId || seller.id}`,
    }));
  } catch (error) {
    console.error('Error fetching segment partners:', error);
    return [];
  }
}

export async function getSegmentDealOfTheDay(
  segment: SegmentType
): Promise<DealOfTheDay | null> {
  try {
    const patterns = SEGMENT_CATEGORY_PATTERNS[segment];

    const lot = await prisma.lot.findFirst({
      where: {
        status: 'ABERTO_PARA_LANCES',
        isFeatured: true,
        discountPercentage: { gt: 0 },
        endDate: { gt: new Date() },
        OR: patterns.flatMap(pattern => [
          { title: insensitiveContains(pattern) },
          { LotCategory: { name: insensitiveContains(pattern) } },
        ]),
      },
      orderBy: [
        { discountPercentage: 'desc' },
        { endDate: 'asc' },
      ],
    });

    if (!lot) return null;

    const currentPrice = Number(lot.price);
    const discountPercentage = lot.discountPercentage || 20;
    const originalPrice = currentPrice / (1 - discountPercentage / 100);

    return {
      lot: {
        id: lot.id.toString(),
        title: lot.title,
        imageUrl: lot.imageUrl || undefined,
        currentPrice,
        evaluationPrice: lot.evaluationValue ? Number(lot.evaluationValue) : undefined,
        minimumPrice: lot.initialPrice ? Number(lot.initialPrice) : undefined,
        bidsCount: lot.bidsCount || 0,
        status: lot.status,
        badges: getLotBadges(lot),
        endDate: lot.endDate || undefined,
      },
      discountPercentage,
      originalPrice,
      urgencyMessage: 'Oferta por tempo limitado!',
      endsAt: lot.endDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  } catch (error) {
    console.error('Error fetching deal of the day:', error);
    return null;
  }
}

export async function getSegmentStats(segment: SegmentType): Promise<{
  eventsCount: number;
  lotsCount: number;
}> {
  try {
    const patterns = SEGMENT_CATEGORY_PATTERNS[segment];

    const [eventsCount, lotsCount] = await Promise.all([
      prisma.auction.count({
        where: {
          status: { in: ['ABERTO_PARA_LANCES', 'EM_BREVE', 'ABERTO'] },
          OR: patterns.flatMap(pattern => [
            { title: insensitiveContains(pattern) },
            { LotCategory: { name: insensitiveContains(pattern) } },
            { Lot: { some: { LotCategory: { name: insensitiveContains(pattern) } } } },
          ]),
        },
      }),
      prisma.lot.count({
        where: {
          status: { in: ['ABERTO_PARA_LANCES', 'EM_BREVE'] },
          OR: patterns.flatMap(pattern => [
            { title: insensitiveContains(pattern) },
            { LotCategory: { name: insensitiveContains(pattern) } },
          ]),
        },
      }),
    ]);

    return { eventsCount, lotsCount };
  } catch (error) {
    console.error('Error fetching segment stats:', error);
    return { eventsCount: 0, lotsCount: 0 };
  }
}

// Helper functions
function mapAuctionTypeToEventType(type: string | null): FeaturedEvent['eventType'] {
  switch (type) {
    case 'PRIMEIRA_PRACA':
      return 'PRIMEIRA_PRACA';
    case 'SEGUNDA_PRACA':
      return 'SEGUNDA_PRACA';
    case 'LEILAO_ONLINE':
      return 'LEILAO_ONLINE';
    case 'ELETRONICO':
      return 'ELETRONICO';
    default:
      return 'EVENTO_UNICO';
  }
}

function mapAuctionStatusToEventStatus(status: string): FeaturedEvent['status'] {
  switch (status) {
    case 'ABERTO_PARA_LANCES':
      return 'ABERTO_PARA_LANCES';
    case 'ABERTO':
      return 'ABERTO_PARA_LANCES';
    case 'ENCERRADO':
      return 'ENCERRADO';
    default:
      return 'EM_BREVE';
  }
}

function mapSellerTypeToPartnerType(type: string | null): PartnerData['type'] {
  const typeMap: Record<string, PartnerData['type']> = {
    BANCO: 'banco',
    SEGURADORA: 'seguradora',
    GOVERNO: 'governo',
    LEILOEIRO: 'leiloeiro',
    CORPORACAO: 'corporacao',
  };
  return typeMap[type || ''] || 'corporacao';
}
