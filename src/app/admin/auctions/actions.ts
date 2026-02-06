// src/app/admin/auctions/actions.ts
/**
 * @fileoverview Server Actions para a entidade Auction (Leilão).
 * Este arquivo exporta funções que lidam com a criação, leitura, atualização
 * e exclusão (CRUD) de leilões. Atua como a camada de Controller que interage
 * com a AuctionService, lida com o contexto de tenant e revalida o cache do Next.js
 * quando necessário.
 */
'use server';

import { revalidatePath } from 'next/cache';
import type {
    Auction,
    AuctionFormData,
    AuctionPreparationAssetSummary,
    AuctionPreparationBid,
    AuctionPreparationData,
    AuctionPreparationHabilitation,
    AuctionPreparationWin,
} from '@/types';
import { AuctionService } from '@/services/auction.service';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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

export async function getAuctions(isPublicCall: boolean = false, limit?: number): Promise<Auction[]> {
    const tenantIdToUse = await getTenantIdFromRequest(isPublicCall);
    const auctions = await auctionService.getAuctions(tenantIdToUse, limit, isPublicCall);
    return JSON.parse(JSON.stringify(auctions, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
    ));
}

export async function getAuction(id: string, isPublicCall: boolean = false): Promise<Auction | null> {
    const tenantId = await getTenantIdFromRequest(isPublicCall);
    return auctionService.getAuctionById(tenantId, id, isPublicCall);
}

export async function getAuctionById(id: bigint, isPublicCall: boolean = false): Promise<Auction | null> {
    const tenantId = await getTenantIdFromRequest(isPublicCall);
    return auctionService.getAuctionById(tenantId, id.toString(), isPublicCall);
}

export async function getAuctionPreparationData(auctionIdentifier: string): Promise<AuctionPreparationData | null> {
    const tenantId = await getTenantIdFromRequest(false);
    const auction = await auctionService.getAuctionById(tenantId, auctionIdentifier, false);
    if (!auction) return null;

    const numericAuctionId = BigInt(auction.id);
    const numericTenantId = BigInt(tenantId);

    const assetWhere: Prisma.AssetWhereInput = {
        tenantId: numericTenantId,
        status: { in: ['DISPONIVEL', 'LOTEADO'] },
    };

    if (auction.sellerId || auction.judicialProcessId) {
        assetWhere.OR = [];
        if (auction.sellerId) {
            assetWhere.OR.push({ sellerId: BigInt(auction.sellerId) });
        }
        if (auction.judicialProcessId) {
            assetWhere.OR.push({ judicialProcessId: BigInt(auction.judicialProcessId) });
        }
    }

    assetWhere.lots = {
        none: {
            lot: {
                auctionId: numericAuctionId,
            },
        },
    };

    const [rawAssets, rawHabilitations, rawBids, rawWins] = await Promise.all([
        prisma.asset.findMany({
            where: assetWhere,
            include: {
                LotCategory: true,
                Seller: true,
                JudicialProcess: true,
            },
            orderBy: { updatedAt: 'desc' },
            take: 50,
        }),
        prisma.auctionHabilitation.findMany({
            where: { auctionId: numericAuctionId },
            include: { User: true },
            orderBy: { habilitatedAt: 'desc' },
        }),
        prisma.bid.findMany({
            where: { auctionId: numericAuctionId },
            include: { User: true, Lot: true },
            orderBy: { timestamp: 'desc' },
        }),
        prisma.userWin.findMany({
            where: { Lot: { auctionId: numericAuctionId } },
            include: { User: true, Lot: true, InstallmentPayment: true },
            orderBy: { winDate: 'desc' },
        }),
    ]);

    const availableAssets: AuctionPreparationAssetSummary[] = rawAssets.map((asset) => ({
        id: asset.id.toString(),
        title: asset.title,
        categoryName: asset.LotCategory?.name ?? undefined,
        evaluationValue: decimalToNumber(asset.evaluationValue),
        status: asset.status,
        sellerName: asset.Seller?.name ?? null,
        judicialProcessNumber: asset.JudicialProcess?.processNumber ?? null,
        source: asset.judicialProcessId ? 'PROCESS' : 'CONSIGNOR',
        locationLabel: asset.locationCity
            ? asset.locationState
                ? `${asset.locationCity}/${asset.locationState}`
                : asset.locationCity
            : asset.locationState ?? null,
        createdAt: asset.createdAt ? asset.createdAt.toISOString() : undefined,
    }));

    const habilitations: AuctionPreparationHabilitation[] = rawHabilitations.map((hab) => ({
        userId: hab.userId.toString(),
        userName: hab.User?.fullName ?? 'Usuário',
        documentNumber: hab.User?.cpf ?? hab.User?.cnpj ?? null,
        email: hab.User?.email ?? undefined,
        phone: hab.User?.cellPhone ?? hab.User?.homePhone ?? undefined,
        status: 'APPROVED',
        createdAt: hab.habilitatedAt ? hab.habilitatedAt.toISOString() : new Date().toISOString(),
    }));

    const bids: AuctionPreparationBid[] = rawBids.map((bid) => ({
        id: bid.id.toString(),
        lotId: bid.lotId.toString(),
        lotTitle: bid.Lot?.title ?? `Lote ${bid.lotId}`,
        lotNumber: bid.Lot?.number ?? undefined,
        bidderId: bid.bidderId.toString(),
        bidderName: bid.User?.fullName ?? 'Participante',
        amount: decimalToNumber(bid.amount),
        timestamp: bid.timestamp.toISOString(),
    }));

    const userWins: AuctionPreparationWin[] = rawWins.map((win) => ({
        id: win.id.toString(),
        lotId: win.lotId.toString(),
        lotTitle: win.Lot?.title ?? `Lote ${win.lotId}`,
        lotNumber: win.Lot?.number ?? undefined,
        userId: win.userId.toString(),
        userName: win.User?.fullName ?? 'Arrematante',
        value: decimalToNumber(win.winningBidAmount),
        paymentStatus: win.paymentStatus,
        winDate: win.winDate ? win.winDate.toISOString() : new Date().toISOString(),
        installments: (win.InstallmentPayment || []).map((installment) => ({
            id: installment.id.toString(),
            amount: decimalToNumber(installment.amount),
            dueDate: installment.dueDate.toISOString(),
            paymentDate: installment.paymentDate ? installment.paymentDate.toISOString() : null,
            status: installment.status,
        })),
    }));

    return {
        auction,
        availableAssets,
        habilitations,
        bids,
        userWins,
    };
}

export async function createAuction(data: Partial<AuctionFormData>): Promise<{ success: boolean, message: string, auctionId?: string }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await auctionService.createAuction(tenantId, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/auctions');
    }
    return result;
}

export async function updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean, message: string }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await auctionService.updateAuction(tenantId, id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/auctions');
        revalidatePath(`/admin/auctions/${id}/edit`);
    }
    return result;
}

export async function deleteAuction(id: string): Promise<{ success: boolean, message: string }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await auctionService.deleteAuction(tenantId, id);
    if (result.success && process.env.NODE_ENV !== 'test') {
      revalidatePath('/admin/auctions');
    }
    return result;
}

export async function updateAuctionTitle(id: string, newTitle: string): Promise<{ success: boolean; message: string; }> {
    if (!newTitle || newTitle.trim().length < 5) {
        return { success: false, message: "Título deve ter pelo menos 5 caracteres." };
    }
    return updateAuction(id, { title: newTitle });
}

export async function updateAuctionImage(auctionId: string, mediaItemId: string, imageUrl: string): Promise<{ success: boolean; message: string; }> {
    return updateAuction(auctionId, { imageMediaId: mediaItemId, imageUrl: imageUrl });
}

export async function updateAuctionFeaturedStatus(id: string, newStatus: boolean): Promise<{ success: boolean; message: string; }> {
    return updateAuction(id, { isFeaturedOnMarketplace: newStatus });
}

export async function getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
   const tenantId = await getTenantIdFromRequest(true); // Public call
   return auctionService.getAuctionsBySellerSlug(tenantId, sellerSlugOrPublicId);
}

export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
    const tenantId = await getTenantIdFromRequest(true); // Public call
    return auctionService.getAuctionsByAuctioneerSlug(tenantId, auctioneerSlug);
}

export async function getAuctionsByIds(ids: string[]): Promise<Auction[]> {
  if (ids.length === 0) return [];
  const tenantId = await getTenantIdFromRequest(true); // Public call
  return auctionService.getAuctionsByIds(tenantId, ids);
}
