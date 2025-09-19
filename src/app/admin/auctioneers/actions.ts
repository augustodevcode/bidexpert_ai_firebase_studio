// src/app/admin/auctioneers/actions.ts
'use server';

import type { AuctioneerProfileInfo, AuctioneerFormData, Auction } from '@/types';
import { revalidatePath } from 'next/cache';
import { AuctioneerService } from '@/services/auctioneer.service';
import { getSession } from '@/app/auth/actions';

const auctioneerService = new AuctioneerService();

async function getTenantIdFromSession(isPublicCall: boolean = false): Promise<string> {
    const session = await getSession();
    if (!session?.tenantId) {
        if (isPublicCall) {
            console.log("[getTenantIdFromSession - Auctioneers] No session, defaulting to Landlord '1'.");
            return '1'; // Default landlord tenant ID for public-facing data
        }
        throw new Error("Acesso não autorizado ou tenant não identificado.");
    }
    return session.tenantId;
}

export async function getAuctioneers(isPublicCall: boolean = false, tenantId?: string): Promise<AuctioneerProfileInfo[]> {
  const tenantIdToUse = tenantId || await getTenantIdFromSession(isPublicCall);
  return auctioneerService.getAuctioneers(tenantIdToUse);
}

export async function getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> {
  const tenantId = await getTenantIdFromSession();
  return auctioneerService.getAuctioneerById(tenantId, id);
}

export async function getAuctioneerBySlug(slugOrId: string): Promise<AuctioneerProfileInfo | null> {
    const tenantId = await getTenantIdFromSession(true); // Public data is always from landlord
    return auctioneerService.getAuctioneerBySlug(tenantId, slugOrId);
}

export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
    const tenantId = await getTenantIdFromSession(true); // Public data is always from landlord
    return auctioneerService.getAuctionsByAuctioneerSlug(tenantId, auctioneerSlug);
}

export async function createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean, message: string, auctioneerId?: string }> {
    const tenantId = await getTenantIdFromSession();
    const result = await auctioneerService.createAuctioneer(tenantId, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
      revalidatePath('/admin/auctioneers');
    }
    return result;
}

export async function updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean, message: string }> {
    const tenantId = await getTenantIdFromSession();
    const result = await auctioneerService.updateAuctioneer(tenantId, id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/auctioneers');
        revalidatePath(`/admin/auctioneers/${id}/edit`);
    }
    return result;
}

export async function deleteAuctioneer(id: string): Promise<{ success: boolean, message: string }> {
    const tenantId = await getTenantIdFromSession();
    const result = await auctioneerService.deleteAuctioneer(tenantId, id);
    if (result.success && process.env.NODE_ENV !== 'test') {
      revalidatePath('/admin/auctioneers');
    }
    return result;
}
