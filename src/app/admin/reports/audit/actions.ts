// src/app/admin/reports/audit/actions.ts
/**
 * @fileoverview Server Actions para o Dashboard de Auditoria e Inconsistências.
 * Contém a lógica de backend para buscar e identificar problemas de integridade
 * nos dados da plataforma.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import { buildAuditData } from './audit-utils';
export type { AuditData } from './audit-utils';

/**
 * Fetches data for the audit and inconsistency dashboard.
 * @returns {Promise<AuditData>} A promise that resolves to an object with arrays of inconsistent entities.
 */
export async function getAuditDataAction(): Promise<AuditData> {
  const tenantId = await getTenantIdFromRequest();
  
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
          select: { id: true, title: true, status: true, publicId: true },
        },
        stages: {
          select: { startDate: true, endDate: true },
        },
      },
    });

    const allLots = await prisma.lot.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { assets: true, bids: true, questions: true, reviews: true, lotPrices: true },
        },
      },
    });
    
    const allAssets = await prisma.asset.findMany({
        where: { tenantId },
        include: {
          _count: {
            select: { lots: true },
          },
        },
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

    const allSellers = await prisma.seller.findMany({
        where: { tenantId },
    });


    return buildAuditData({
      auctions: allAuctions,
      lots: allLots,
      assets: allAssets,
      directSales: allDirectSales,
      users: allUsers,
      sellers: allSellers,
    });
  } catch (error: any) {
    console.error("[Action - getAuditDataAction] Error fetching audit data:", error);
    throw new Error("Falha ao buscar dados de auditoria.");
  }
}
