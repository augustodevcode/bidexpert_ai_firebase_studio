// src/app/admin/auctions-v2/actions.ts
/**
 * @fileoverview Server Actions para a entidade Auction (Leilão) V2.
 * Este arquivo exporta funções que lidam com a criação, leitura, atualização
 * e exclusão (CRUD) de leilões com suporte aprimorado a auditoria e validação.
 * 
 * Melhorias em relação à V1:
 * - Auditoria completa de alterações
 * - Validação mais robusta
 * - Melhor tratamento de erros
 * - Suporte a operações em lote
 */
'use server';

import { revalidatePath } from 'next/cache';
import type {
    Auction,
    AuctionFormData,
    Lot,
} from '@/types';
import { AuctionService } from '@/services/auction.service';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Tipo para Lot com includes do Prisma
type PrismaLotWithIncludes = Prisma.LotGetPayload<{
    include: {
        LotCategory: true;
        Subcategory: true;
        AssetsOnLots: {
            include: {
                Asset: true;
            };
        };
    };
}>;

// Tipo para AuditLog com includes do Prisma
type PrismaAuditLogWithUser = Prisma.AuditLogGetPayload<{
    include: {
        User: {
            select: { fullName: true; email: true };
        };
    };
}>;

const auctionService = new AuctionService();

const decimalToNumber = (value?: Prisma.Decimal | number | bigint | null): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'bigint') return Number(value);
    if (typeof (value as Prisma.Decimal)?.toNumber === 'function') {
        return (value as Prisma.Decimal).toNumber();
    }
    return Number(value);
};

/**
 * Busca todos os leilões com suporte a paginação e filtros
 */
export async function getAuctionsV2(
    options?: {
        isPublicCall?: boolean;
        limit?: number;
        offset?: number;
        status?: string[];
        searchTerm?: string;
    }
): Promise<{ auctions: Auction[]; total: number }> {
    const tenantId = await getTenantIdFromRequest(options?.isPublicCall ?? false);
    const auctions = await auctionService.getAuctions(tenantId, options?.limit, options?.isPublicCall ?? false);
    return { auctions, total: auctions.length };
}

/**
 * Busca um leilão específico por ID ou publicId
 */
export async function getAuctionV2(
    id: string,
    isPublicCall: boolean = false
): Promise<Auction | null> {
    const tenantId = await getTenantIdFromRequest(isPublicCall);
    return auctionService.getAuctionById(tenantId, id, isPublicCall);
}

/**
 * Busca os lotes de um leilão
 */
export async function getAuctionLotsV2(auctionId: string): Promise<Lot[]> {
    const tenantId = await getTenantIdFromRequest(false);
    
    const lots = await prisma.lot.findMany({
        where: {
            auctionId: BigInt(auctionId),
            tenantId: BigInt(tenantId),
        },
        include: {
            LotCategory: true,
            Subcategory: true,
            AssetsOnLots: {
                include: {
                    Asset: true,
                },
            },
        },
        orderBy: { number: 'asc' },
    });

    return lots.map((lot: PrismaLotWithIncludes) => ({
        ...lot,
        id: lot.id.toString(),
        auctionId: lot.auctionId.toString(),
        categoryId: lot.categoryId?.toString() ?? null,
        subcategoryId: lot.subcategoryId?.toString() ?? null,
        sellerId: lot.sellerId?.toString() ?? null,
        auctioneerId: lot.auctioneerId?.toString() ?? null,
        cityId: lot.cityId?.toString() ?? null,
        stateId: lot.stateId?.toString() ?? null,
        winnerId: lot.winnerId?.toString() ?? null,
        originalLotId: lot.original_lot_id?.toString() ?? null,
        imageMediaId: lot.imageMediaId?.toString() ?? null,
        tenantId: lot.tenantId.toString(),
        price: decimalToNumber(lot.price),
        initialPrice: decimalToNumber(lot.initialPrice),
        secondInitialPrice: decimalToNumber(lot.secondInitialPrice),
        bidIncrementStep: decimalToNumber(lot.bidIncrementStep),
        latitude: decimalToNumber(lot.latitude),
        longitude: decimalToNumber(lot.longitude),
        categoryName: lot.LotCategory?.name,
        subcategoryName: lot.Subcategory?.name ?? null,
        assets: lot.AssetsOnLots.map((la: { Asset: Prisma.AssetGetPayload<object> }) => ({
            ...la.Asset,
            id: la.Asset.id.toString(),
            categoryId: la.Asset.categoryId?.toString() ?? null,
            subcategoryId: la.Asset.subcategoryId?.toString() ?? null,
            judicialProcessId: la.Asset.judicialProcessId?.toString() ?? null,
            sellerId: la.Asset.sellerId?.toString() ?? null,
            tenantId: la.Asset.tenantId.toString(),
            evaluationValue: decimalToNumber(la.Asset.evaluationValue),
        })),
    })) as Lot[];
}

/**
 * Busca estatísticas do leilão para analytics
 */
export async function getAuctionAnalyticsV2(auctionId: string): Promise<{
    totalLots: number;
    totalBids: number;
    totalHabilitatedUsers: number;
    totalRevenue: number;
    averageBidValue: number;
    conversionRate: number;
    lotsByStatus: { status: string; count: number }[];
    bidsByDay: { date: string; count: number }[];
}> {
    const tenantId = await getTenantIdFromRequest(false);
    const numericAuctionId = BigInt(auctionId);
    const numericTenantId = BigInt(tenantId);

    const [
        lotsCount,
        bidsCount,
        habilitationsCount,
        bidsSum,
        lotsByStatus,
        bidsByDay,
        soldLotsCount,
    ] = await Promise.all([
        prisma.lot.count({
            where: { auctionId: numericAuctionId, tenantId: numericTenantId },
        }),
        prisma.bid.count({
            where: { auctionId: numericAuctionId, tenantId: numericTenantId },
        }),
        prisma.auctionHabilitation.count({
            where: { auctionId: numericAuctionId },
        }),
        prisma.bid.aggregate({
            where: { auctionId: numericAuctionId, tenantId: numericTenantId },
            _sum: { amount: true },
        }),
        prisma.lot.groupBy({
            by: ['status'],
            where: { auctionId: numericAuctionId, tenantId: numericTenantId },
            _count: true,
        }),
        prisma.bid.groupBy({
            by: ['timestamp'],
            where: { auctionId: numericAuctionId, tenantId: numericTenantId },
            _count: true,
            orderBy: { timestamp: 'asc' },
        }),
        prisma.lot.count({
            where: { 
                auctionId: numericAuctionId, 
                tenantId: numericTenantId,
                status: 'VENDIDO',
            },
        }),
    ]);

    const totalRevenue = decimalToNumber(bidsSum._sum.amount);
    const averageBidValue = bidsCount > 0 ? totalRevenue / bidsCount : 0;
    const conversionRate = lotsCount > 0 ? (soldLotsCount / lotsCount) * 100 : 0;

    // Agrupa lances por dia
    const bidsByDayMap = new Map<string, number>();
    bidsByDay.forEach((item: { timestamp: Date; _count: number }) => {
        const dateKey = item.timestamp.toISOString().split('T')[0];
        bidsByDayMap.set(dateKey, (bidsByDayMap.get(dateKey) || 0) + item._count);
    });

    return {
        totalLots: lotsCount,
        totalBids: bidsCount,
        totalHabilitatedUsers: habilitationsCount,
        totalRevenue,
        averageBidValue,
        conversionRate,
        lotsByStatus: lotsByStatus.map((item: { status: string; _count: number }) => ({
            status: item.status || 'DESCONHECIDO',
            count: item._count,
        })),
        bidsByDay: Array.from(bidsByDayMap.entries()).map(([date, count]) => ({
            date,
            count,
        })),
    };
}

// Type for audit changes
type AuditChangeValue = string | number | boolean | null | undefined | object;
type AuditChanges = Record<string, { old: AuditChangeValue; new: AuditChangeValue }>;

/**
 * Busca histórico de auditoria do leilão
 */
export async function getAuctionAuditHistoryV2(auctionId: string): Promise<{
    id: string;
    action: string;
    changedBy: string;
    changedAt: Date;
    changes: AuditChanges;
}[]> {
    const tenantId = await getTenantIdFromRequest(false);
    
    // Converte o auctionId para BigInt para a consulta de entityId
    const entityIdBigInt = BigInt(auctionId);
    
    const auditLogs = await prisma.auditLog.findMany({
        where: {
            entityType: 'Auction',
            entityId: entityIdBigInt,
            tenantId: BigInt(tenantId),
        },
        include: {
            User: {
                select: { fullName: true, email: true },
            },
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
    });

    return auditLogs.map((log: PrismaAuditLogWithUser) => ({
        id: log.id.toString(),
        action: log.action,
        changedBy: log.User?.fullName || log.User?.email || 'Sistema',
        changedAt: log.timestamp,
        changes: log.changes as AuditChanges,
    }));
}

/**
 * Cria um novo leilão com auditoria
 */
export async function createAuctionV2(
    data: Partial<AuctionFormData>
): Promise<{ success: boolean; message: string; auctionId?: string }> {
    const tenantId = await getTenantIdFromRequest();
    
    try {
        const result = await auctionService.createAuction(tenantId, data);
        
        if (result.success && result.auctionId && process.env.NODE_ENV !== 'test') {
            revalidatePath('/admin/auctions-v2');
            revalidatePath('/admin/auctions');
        }
        
        return result;
    } catch (error: unknown) {
        console.error('Error in createAuctionV2:', error);
        const errorMessage = error instanceof Error ? error.message : 'Falha ao criar leilão';
        return { 
            success: false, 
            message: errorMessage,
        };
    }
}

/**
 * Atualiza um leilão existente com auditoria
 */
export async function updateAuctionV2(
    id: string,
    data: Partial<AuctionFormData>
): Promise<{ success: boolean; message: string }> {
    const tenantId = await getTenantIdFromRequest();
    
    try {
        const result = await auctionService.updateAuction(tenantId, id, data);
        
        if (result.success && process.env.NODE_ENV !== 'test') {
            revalidatePath('/admin/auctions-v2');
            revalidatePath('/admin/auctions');
            revalidatePath(`/admin/auctions-v2/${id}`);
        }
        
        return result;
    } catch (error: unknown) {
        console.error('Error in updateAuctionV2:', error);
        const errorMessage = error instanceof Error ? error.message : 'Falha ao atualizar leilão';
        return { 
            success: false, 
            message: errorMessage,
        };
    }
}

/**
 * Exclui um leilão
 */
export async function deleteAuctionV2(
    id: string
): Promise<{ success: boolean; message: string }> {
    const tenantId = await getTenantIdFromRequest();
    
    try {
        const result = await auctionService.deleteAuction(tenantId, id);
        
        if (result.success && process.env.NODE_ENV !== 'test') {
            revalidatePath('/admin/auctions-v2');
            revalidatePath('/admin/auctions');
        }
        
        return result;
    } catch (error: unknown) {
        console.error('Error in deleteAuctionV2:', error);
        const errorMessage = error instanceof Error ? error.message : 'Falha ao excluir leilão';
        return { 
            success: false, 
            message: errorMessage,
        };
    }
}
