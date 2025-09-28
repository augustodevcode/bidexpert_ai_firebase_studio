// src/app/admin/reports/audit/actions.ts
/**
 * @fileoverview Server Actions para o Dashboard de Auditoria e Inconsistências.
 * Contém a lógica de backend para buscar e identificar problemas de integridade
 * nos dados da plataforma.
 */
'use server';

import { getPrismaInstance } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import type { Auction, Lot, Asset, DirectSaleOffer, UserProfileData } from '@/types';

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
  lotsWithoutQuestions: Partial<Lot>[];
  lotsWithoutReviews: Partial<Lot>[];
  habilitatedUsersWithoutDocs: Partial<UserProfileData>[];
}

/**
 * Fetches data for the audit and inconsistency dashboard.
 * @returns {Promise<AuditData>} A promise that resolves to an object with arrays of inconsistent entities.
 */
export async function getAuditDataAction(): Promise<AuditData> {
  const tenantId = await getTenantIdFromRequest();
  const prisma = getPrismaInstance();

  try {
    const allAuctions = await prisma.auction.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { lots: true, stages: true },
        },
        lots: {
          where: {
            status: { in: ['EM_BREVE', 'ABERTO_PARA_LANCES'] },
          },
          select: { id: true, title: true, status: true },
        },
      },
    });

    const allLots = await prisma.lot.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { assets: true, bids: true, questions: true, reviews: true },
        },
      },
    });
    
    const allAssets = await prisma.asset.findMany({
        where: { tenantId },
    });

    const allDirectSales = await prisma.directSaleOffer.findMany({
        where: { tenantId },
    });

    const allUsers = await prisma.user.findMany({
        where: { tenants: { some: { tenantId: tenantId } } },
        include: {
            _count: {
                select: { documents: true }
            }
        }
    });

    const auctionsWithoutLots = allAuctions
      .filter(a => a._count.lots === 0 && !['RASCUNHO', 'EM_PREPARACAO'].includes(a.status))
      .map(a => ({ id: a.id, title: a.title, status: a.status, publicId: a.publicId }));

    const lotsWithoutAssets = allLots
      .filter(l => l._count.assets === 0)
      .map(l => ({ id: l.id, title: l.title, status: l.status, publicId: l.publicId, auctionId: l.auctionId }));

    const auctionsWithoutStages = allAuctions
      .filter(a => a._count.stages === 0 && !['RASCUNHO', 'EM_PREPARACAO'].includes(a.status))
      .map(a => ({ id: a.id, title: a.title, status: a.status, publicId: a.publicId }));

    const closedAuctionsWithOpenLots = allAuctions
      .filter(a => (a.status === 'ENCERRADO' || a.status === 'FINALIZADO') && a.lots.length > 0)
      .map(a => ({ auction: {id: a.id, title: a.title, status: a.status, publicId: a.publicId}, lots: a.lots }));
      
    const canceledAuctionsWithOpenLots = allAuctions
      .filter(a => a.status === 'CANCELADO' && a.lots.length > 0)
      .map(a => ({ auction: {id: a.id, title: a.title, status: a.status, publicId: a.publicId}, lots: a.lots }));
      
    const auctionsWithoutLocation = allAuctions
      .filter(a => !a.cityId && !a.stateId)
      .map(a => ({ id: a.id, title: a.title, status: a.status, publicId: a.publicId }));

    const lotsWithoutLocation = allLots
      .filter(l => !l.cityId && !l.stateId)
      .map(l => ({ id: l.id, title: l.title, status: l.status, publicId: l.publicId, auctionId: l.auctionId }));

    const assetsWithoutLocation = allAssets
        .filter(a => !a.locationCity && !a.locationState)
        .map(a => ({ id: a.id, title: a.title, status: a.status, publicId: a.publicId }));

    const assetsWithoutRequiredLinks = allAssets
      .filter(b => !b.categoryId || !b.sellerId)
      .map(b => ({ id: b.id, title: b.title, status: b.status, publicId: b.publicId }));

    const endedLotsWithoutBids = allLots
      .filter(l => l.status === 'ENCERRADO' && l._count.bids === 0)
      .map(l => ({ id: l.id, title: l.title, status: l.status, publicId: l.publicId, auctionId: l.auctionId }));
      
    const directSalesWithMissingData = allDirectSales
      .filter(d => (d.offerType === 'BUY_NOW' && !d.price) || !d.sellerId || !d.categoryId)
      .map(d => ({ id: d.id, title: d.title, status: d.status, publicId: d.publicId }));
      
    const lotsWithoutQuestions = allLots
        .filter(l => l._count.questions === 0 && (l.status === 'ABERTO_PARA_LANCES' || l.status === 'VENDIDO'))
        .map(l => ({ id: l.id, title: l.title, status: l.status, publicId: l.publicId, auctionId: l.auctionId }));

    const lotsWithoutReviews = allLots
        .filter(l => l._count.reviews === 0 && l.status === 'VENDIDO')
        .map(l => ({ id: l.id, title: l.title, status: l.status, publicId: l.publicId, auctionId: l.auctionId }));
    
    const habilitatedUsersWithoutDocs = allUsers
        .filter(u => u.habilitationStatus === 'HABILITADO' && u._count.documents === 0)
        .map(u => ({ id: u.id, fullName: u.fullName, email: u.email }));

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
      lotsWithoutQuestions,
      lotsWithoutReviews,
      habilitatedUsersWithoutDocs,
    };
  } catch (error: any) {
    console.error("[Action - getAuditDataAction] Error fetching audit data:", error);
    throw new Error("Falha ao buscar dados de auditoria.");
  }
}
