// src/app/admin/reports/audit/actions.ts
/**
 * @fileoverview Server Actions para o Dashboard de Auditoria e Inconsistências.
 * Contém a lógica de backend para buscar e identificar problemas de integridade
 * nos dados da plataforma.
 */
'use server';

import { getPrismaInstance } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import type { Auction, Lot } from '@/types';

export interface AuditData {
  auctionsWithoutLots: Partial<Auction>[];
  lotsWithoutBens: Partial<Lot>[];
  auctionsWithoutStages: Partial<Auction>[];
  closedAuctionsWithOpenLots: { auction: Partial<Auction>, lots: Partial<Lot>[] }[];
  canceledAuctionsWithOpenLots: { auction: Partial<Auction>, lots: Partial<Lot>[] }[];
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
          select: { bens: true },
        },
      },
    });

    const auctionsWithoutLots = allAuctions
      .filter(a => a._count.lots === 0)
      .map(a => ({ id: a.id, title: a.title, status: a.status, publicId: a.publicId }));

    const lotsWithoutBens = allLots
      .filter(l => l._count.bens === 0)
      .map(l => ({ id: l.id, title: l.title, status: l.status, publicId: l.publicId, auctionId: l.auctionId }));

    const auctionsWithoutStages = allAuctions
      .filter(a => a._count.stages === 0)
      .map(a => ({ id: a.id, title: a.title, status: a.status, publicId: a.publicId }));

    const closedAuctionsWithOpenLots = allAuctions
      .filter(a => (a.status === 'ENCERRADO' || a.status === 'FINALIZADO') && a.lots.length > 0)
      .map(a => ({ auction: {id: a.id, title: a.title, status: a.status, publicId: a.publicId}, lots: a.lots }));
      
    const canceledAuctionsWithOpenLots = allAuctions
      .filter(a => a.status === 'CANCELADO' && a.lots.length > 0)
      .map(a => ({ auction: {id: a.id, title: a.title, status: a.status, publicId: a.publicId}, lots: a.lots }));

    return {
      auctionsWithoutLots,
      lotsWithoutBens,
      auctionsWithoutStages,
      closedAuctionsWithOpenLots,
      canceledAuctionsWithOpenLots,
    };
  } catch (error: any) {
    console.error("[Action - getAuditDataAction] Error fetching audit data:", error);
    throw new Error("Falha ao buscar dados de auditoria.");
  }
}
