/**
 * @file Segment Home V2 Page Data Fetching
 * @description Utility functions to fetch data for segment landing pages
 * including events, lots, partners, and deals of the day.
 */

import { prisma } from '@/lib/prisma';
import type {
  FeaturedEvent,
  LotCardData,
  PartnerData,
  DealOfTheDay,
  LotBadge,
  SegmentType
} from './types';

// Map segment to database category patterns
const SEGMENT_CATEGORY_PATTERNS: Record<SegmentType, string[]> = {
  veiculos: ['veículo', 'veiculo', 'carro', 'moto', 'caminhão', 'caminhao', 'ônibus', 'onibus', 'automóvel', 'automovel'],
  imoveis: ['imóvel', 'imovel', 'casa', 'apartamento', 'terreno', 'sala', 'galpão', 'galpao', 'loja'],
  maquinas: ['máquina', 'maquina', 'equipamento', 'trator', 'escavadeira', 'empilhadeira', 'industrial'],
  tecnologia: ['eletrônico', 'eletronico', 'informática', 'informatica', 'computador', 'notebook', 'celular', 'servidor'],
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

    const auctions = await prisma.auction.findMany({
      where: {
        status: {
          in: ['ABERTO_PARA_LANCES', 'EM_BREVE'],
        },
        OR: [
          {
            category: {
              name: {
                contains: patterns[0],
              },
            },
          },
          {
            title: {
              contains: patterns[0],
            },
          },
        ],
      },
      include: {
        seller: true,
        auctioneer: true,
        _count: {
          select: { lots: true },
        },
      },
      orderBy: { auctionDate: 'asc' },
      take: limit,
    });

    return auctions.map((auction) => ({
      id: auction.id.toString(),
      title: auction.title,
      consignor: auction.seller?.name || auction.auctioneer?.name || 'BidExpert',
      consignorLogo: auction.seller?.logoUrl || auction.auctioneer?.logoUrl || undefined,
      eventType: mapAuctionTypeToEventType(auction.auctionType),
      startDate: auction.auctionDate || new Date(),
      endDate: auction.endDate || new Date(),
      status: mapAuctionStatusToEventStatus(auction.status),
      lotsCount: auction._count.lots,
      imageUrl: auction.seller?.logoUrl || undefined,
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
        OR: patterns.map(pattern => ({
          OR: [
            { title: { contains: pattern } },
            { category: { name: { contains: pattern } } },
            { type: { contains: pattern } },
          ],
        })),
      },
      include: {
        category: true,
        auction: {
          include: {
            seller: true,
            auctioneer: true,
            stages: true,
          }
        },
        lotPrices: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { endDate: 'asc' },
      ],
      take: limit,
    });

    return lots;
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
      where: {
        isActive: true,
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    return sellers.map((seller) => ({
      id: seller.id.toString(),
      name: seller.name,
      logoUrl: seller.logoUrl || '',
      type: mapSellerTypeToPartnerType(seller.sellerType),
      href: `/sellers/${seller.slug || seller.publicId || seller.id}`,
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
        OR: patterns.map(pattern => ({
          OR: [
            { title: { contains: pattern } },
            { category: { name: { contains: pattern } } },
          ],
        })),
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
          status: { in: ['ABERTO_PARA_LANCES', 'EM_BREVE'] },
          OR: patterns.map(pattern => ({
            OR: [
              { title: { contains: pattern } },
              { category: { name: { contains: pattern } } },
            ],
          })),
        },
      }),
      prisma.lot.count({
        where: {
          status: { in: ['ABERTO_PARA_LANCES', 'EM_BREVE'] },
          OR: patterns.map(pattern => ({
            OR: [
              { title: { contains: pattern } },
              { category: { name: { contains: pattern } } },
            ],
          })),
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
