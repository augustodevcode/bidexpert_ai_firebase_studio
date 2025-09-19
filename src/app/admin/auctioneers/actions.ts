// src/app/admin/auctioneers/actions.ts
'use server';

import type { AuctioneerProfileInfo, AuctioneerFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import { AuctioneerService } from '@/services/auctioneer.service';
import { getSession } from '@/app/auth/actions';
import { headers } from 'next/headers';

const auctioneerService = new AuctioneerService();

async function getTenantIdFromRequest(isPublicCall: boolean = false): Promise<string> {
    const session = await getSession();
    if (session?.tenantId) {
        return session.tenantId;
    }

    const headersList = headers();
    const tenantIdFromHeader = headersList.get('x-tenant-id');

    if (tenantIdFromHeader) {
        return tenantIdFromHeader;
    }

    // For public calls, we assume we want landlord data if no specific context is found
    if (isPublicCall) {
        return '1';
    }
    
    throw new Error("Acesso não autorizado ou tenant não identificado.");
}


export async function getAuctioneers(isPublicCall: boolean = false, tenantId?: string): Promise<AuctioneerProfileInfo[]> {
  const tenantIdToUse = tenantId || await getTenantIdFromRequest(isPublicCall);
  return auctioneerService.getAuctioneers(tenantIdToUse);
}

export async function getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> {
  const tenantId = await getTenantIdFromRequest();
  return auctioneerService.getAuctioneerById(tenantId, id);
}

export async function getAuctioneerBySlug(slugOrId: string): Promise<AuctioneerProfileInfo | null> {
    const tenantId = await getTenantIdFromRequest(true); // Public data is always from landlord
    return auctioneerService.getAuctioneerBySlug(tenantId, slugOrId);
}

export async function createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean, message: string, auctioneerId?: string }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await auctioneerService.createAuctioneer(tenantId, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
      revalidatePath('/admin/auctioneers');
    }
    return result;
}

export async function updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean, message: string }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await auctioneerService.updateAuctioneer(tenantId, id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/auctioneers');
        revalidatePath(`/admin/auctioneers/${id}/edit`);
    }
    return result;
}

export async function deleteAuctioneer(id: string): Promise<{ success: boolean, message: string }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await auctioneerService.deleteAuctioneer(tenantId, id);
    if (result.success && process.env.NODE_ENV !== 'test') {
      revalidatePath('/admin/auctioneers');
    }
    return result;
}
