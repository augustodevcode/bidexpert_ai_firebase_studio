/**
 * @fileoverview Utilitários para cálculo das inconsistências do painel de auditoria.
 * Centraliza regras de cruzamento para facilitar testes e evolução das validações.
 */

import type { Auction, Lot, Asset, DirectSaleOffer, UserProfileWithPermissions, SellerProfileInfo } from '@/types';

export interface AuditData {
  auctionsWithoutLots: Partial<Auction>[];
  lotsWithoutAssets: Partial<Lot>[];
  auctionsWithoutStages: Partial<Auction>[];
  closedAuctionsWithOpenLots: { auction: Partial<Auction>, lots: Partial<Lot>[] }[];
  canceledAuctionsWithOpenLots: { auction: Partial<Auction>, lots: Partial<Lot>[] }[];
  auctionsWithoutLocation: Partial<Auction>[];
  lotsWithoutLocation: Partial<Lot>[];
  assetsWithoutLocation: Partial<Asset>[];
  assetsWithoutRequiredLinks: Partial<Asset>[];
  endedLotsWithoutBids: Partial<Lot>[];
  directSalesWithMissingData: Partial<DirectSaleOffer>[];
  directSalesWithoutImages: Partial<DirectSaleOffer>[];
  directSalesWithoutLocation: Partial<DirectSaleOffer>[];
  lotsWithoutQuestions: Partial<Lot>[];
  lotsWithoutReviews: Partial<Lot>[];
  habilitatedUsersWithoutDocs: Partial<UserProfileWithPermissions>[];
  lotsWithoutImages: Partial<Lot>[];
  assetsWithoutImages: Partial<Asset>[];
  judicialAuctionsWithoutProcess: Partial<Auction>[];
  judicialAuctionsWithProcessMismatch: Partial<Auction>[];
  judicialSellersWithoutBranch: Partial<SellerProfileInfo>[];
  auctionsMissingResponsibleParties: Partial<Auction>[];
  auctionsMissingSchedule: Partial<Auction>[];
  lotsSoldWithoutWinner: Partial<Lot>[];
  assetsLoteadoWithoutLots: Partial<Asset>[];
  assetsDisponivelWithLots: Partial<Asset>[];
}

type AuditAuction = Auction & {
  _count: { lots: number; stages: number };
  lots: { id: string | number | bigint; title: string; status: string; publicId?: string | null }[];
  stages?: { startDate: Date | null; endDate: Date | null }[];
};

type AuditLot = Lot & {
  _count: { assets: number; bids: number; questions: number; reviews: number; lotPrices?: number };
};

type AuditAsset = Asset & { _count?: { lots?: number } };

type AuditUser = UserProfileWithPermissions & { _count: { documents: number } };

type AuditSeller = SellerProfileInfo & { isJudicial?: boolean | null; judicialBranchId?: string | number | bigint | null };

export interface AuditSourceData {
  auctions: AuditAuction[];
  lots: AuditLot[];
  assets: AuditAsset[];
  directSales: DirectSaleOffer[];
  users: AuditUser[];
  sellers: AuditSeller[];
}

const hasJsonArray = (value: unknown): boolean => Array.isArray(value) && value.length > 0;

const hasImage = (item: { imageUrl?: string | null; imageMediaId?: unknown; galleryImageUrls?: unknown; mediaItemIds?: unknown }): boolean => {
  return Boolean(item.imageUrl || item.imageMediaId || hasJsonArray(item.galleryImageUrls) || hasJsonArray(item.mediaItemIds));
};

const hasAuctionSchedule = (auction: AuditAuction): boolean => {
  if (auction.auctionDate && auction.endDate) return true;
  return Boolean(auction.stages?.some(stage => stage.startDate && stage.endDate));
};

export function buildAuditData(source: AuditSourceData): AuditData {
  const {
    auctions,
    lots,
    assets,
    directSales,
    users,
    sellers,
  } = source;

  const publishedAuctionStatuses = ['EM_BREVE', 'ABERTO', 'ABERTO_PARA_LANCES', 'ENCERRADO', 'FINALIZADO'];
  const openAuctionStatuses = ['EM_BREVE', 'ABERTO', 'ABERTO_PARA_LANCES'];

  const auctionsWithoutLots = auctions
    .filter(a => a._count.lots === 0 && !['RASCUNHO', 'EM_PREPARACAO'].includes(a.status))
    .map(a => ({ id: a.id, title: a.title, status: a.status, publicId: a.publicId }));

  const lotsWithoutAssets = lots
    .filter(l => l._count.assets === 0)
    .map(l => ({ id: l.id, title: l.title, status: l.status, publicId: l.publicId, auctionId: l.auctionId }));

  const auctionsWithoutStages = auctions
    .filter(a => a._count.stages === 0 && !['RASCUNHO', 'EM_PREPARACAO'].includes(a.status))
    .map(a => ({ id: a.id, title: a.title, status: a.status, publicId: a.publicId }));

  const closedAuctionsWithOpenLots = auctions
    .filter(a => (a.status === 'ENCERRADO' || a.status === 'FINALIZADO') && a.lots.length > 0)
    .map(a => ({ auction: { id: a.id, title: a.title, status: a.status, publicId: a.publicId }, lots: a.lots }));

  const canceledAuctionsWithOpenLots = auctions
    .filter(a => a.status === 'CANCELADO' && a.lots.length > 0)
    .map(a => ({ auction: { id: a.id, title: a.title, status: a.status, publicId: a.publicId }, lots: a.lots }));

  const auctionsWithoutLocation = auctions
    .filter(a => !a.cityId && !a.stateId && !a.zipCode && !a.street)
    .map(a => ({ id: a.id, title: a.title, status: a.status, publicId: a.publicId }));

  const lotsWithoutLocation = lots
    .filter(l => !l.cityId && !l.stateId && !l.cityName && !l.stateUf)
    .map(l => ({ id: l.id, title: l.title, status: l.status, publicId: l.publicId, auctionId: l.auctionId }));

  const assetsWithoutLocation = assets
    .filter(a => !a.address && !a.locationCity && !a.locationState && !a.latitude && !a.longitude)
    .map(a => ({ id: a.id, title: a.title, status: a.status, publicId: a.publicId }));

  const assetsWithoutRequiredLinks = assets
    .filter(b => !b.categoryId || !b.sellerId)
    .map(b => ({ id: b.id, title: b.title, status: b.status, publicId: b.publicId }));

  const endedLotsWithoutBids = lots
    .filter(l => l.status === 'ENCERRADO' && l._count.bids === 0)
    .map(l => ({ id: l.id, title: l.title, status: l.status, publicId: l.publicId, auctionId: l.auctionId }));

  const directSalesWithMissingData = directSales
    .filter(d => (d.offerType === 'BUY_NOW' && !d.price) || (d.offerType === 'ACCEPTS_PROPOSALS' && !d.minimumOfferPrice) || !d.sellerId || !d.categoryId)
    .map(d => ({ id: d.id, title: d.title, status: d.status, publicId: d.publicId }));

  const directSalesWithoutImages = directSales
    .filter(d => !hasImage(d))
    .map(d => ({ id: d.id, title: d.title, status: d.status, publicId: d.publicId }));

  const directSalesWithoutLocation = directSales
    .filter(d => !d.locationCity && !d.locationState)
    .map(d => ({ id: d.id, title: d.title, status: d.status, publicId: d.publicId }));

  const lotsWithoutQuestions = lots
    .filter(l => l._count.questions === 0 && (l.status === 'ABERTO_PARA_LANCES' || l.status === 'VENDIDO'))
    .map(l => ({ id: l.id, title: l.title, status: l.status, publicId: l.publicId, auctionId: l.auctionId }));

  const lotsWithoutReviews = lots
    .filter(l => l._count.reviews === 0 && l.status === 'VENDIDO')
    .map(l => ({ id: l.id, title: l.title, status: l.status, publicId: l.publicId, auctionId: l.auctionId }));

  const habilitatedUsersWithoutDocs = users
    .filter(u => u.habilitationStatus === 'HABILITADO' && u._count.documents === 0)
    .map(u => ({ id: u.id, fullName: u.fullName, email: u.email }));

  const lotsWithoutImages = lots
    .filter(l => !hasImage(l))
    .map(l => ({ id: l.id, title: l.title, status: l.status, publicId: l.publicId, auctionId: l.auctionId }));

  const assetsWithoutImages = assets
    .filter(a => !hasImage(a))
    .map(a => ({ id: a.id, title: a.title, status: a.status, publicId: a.publicId }));

  const judicialAuctionsWithoutProcess = auctions
    .filter(a => a.auctionType === 'JUDICIAL' && !a.judicialProcessId)
    .map(a => ({ id: a.id, title: a.title, status: a.status, publicId: a.publicId }));

  const judicialAuctionsWithProcessMismatch = auctions
    .filter(a => a.auctionType !== 'JUDICIAL' && a.judicialProcessId)
    .map(a => ({ id: a.id, title: a.title, status: a.status, publicId: a.publicId }));

  const judicialSellersWithoutBranch = sellers
    .filter(s => s.isJudicial && !s.judicialBranchId)
    .map(s => ({ id: s.id, name: s.name, publicId: s.publicId } as Partial<SellerProfileInfo>));

  const auctionsMissingResponsibleParties = auctions
    .filter(a => publishedAuctionStatuses.includes(a.status) && (!a.sellerId || !a.auctioneerId))
    .map(a => ({ id: a.id, title: a.title, status: a.status, publicId: a.publicId }));

  const auctionsMissingSchedule = auctions
    .filter(a => openAuctionStatuses.includes(a.status) && !hasAuctionSchedule(a))
    .map(a => ({ id: a.id, title: a.title, status: a.status, publicId: a.publicId }));

  const lotsSoldWithoutWinner = lots
    .filter(l => l.status === 'VENDIDO' && !l.winnerId)
    .map(l => ({ id: l.id, title: l.title, status: l.status, publicId: l.publicId, auctionId: l.auctionId }));

  const assetsLoteadoWithoutLots = assets
    .filter(a => a.status === 'LOTEADO' && (a._count?.lots ?? 0) === 0)
    .map(a => ({ id: a.id, title: a.title, status: a.status, publicId: a.publicId }));

  const assetsDisponivelWithLots = assets
    .filter(a => a.status === 'DISPONIVEL' && (a._count?.lots ?? 0) > 0)
    .map(a => ({ id: a.id, title: a.title, status: a.status, publicId: a.publicId }));

  return {
    auctionsWithoutLots,
    lotsWithoutAssets,
    auctionsWithoutStages,
    closedAuctionsWithOpenLots,
    canceledAuctionsWithOpenLots,
    auctionsWithoutLocation,
    lotsWithoutLocation,
    assetsWithoutLocation,
    assetsWithoutRequiredLinks,
    endedLotsWithoutBids,
    directSalesWithMissingData,
    directSalesWithoutImages,
    directSalesWithoutLocation,
    lotsWithoutQuestions,
    lotsWithoutReviews,
    habilitatedUsersWithoutDocs,
    lotsWithoutImages,
    assetsWithoutImages,
    judicialAuctionsWithoutProcess,
    judicialAuctionsWithProcessMismatch,
    judicialSellersWithoutBranch,
    auctionsMissingResponsibleParties,
    auctionsMissingSchedule,
    lotsSoldWithoutWinner,
    assetsLoteadoWithoutLots,
    assetsDisponivelWithLots,
  };
}
