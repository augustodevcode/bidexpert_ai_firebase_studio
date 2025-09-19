// src/app/admin/sellers/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { SellerProfileInfo, SellerFormData, Lot } from '@/types';
import { SellerService } from '@/services/seller.service';
import { getSession } from '@/app/auth/actions';

const sellerService = new SellerService();

async function getTenantIdFromSession(isPublicCall: boolean = false): Promise<string> {
    const session = await getSession();
    if (!session?.tenantId) {
        if (isPublicCall) {
            console.log("[getTenantIdFromSession - Sellers] No session found, but it's a public page. Defaulting to Landlord tenant '1'.");
            return '1'; // Default landlord tenant ID for public-facing data
        }
        throw new Error("Acesso não autorizado ou tenant não identificado.");
    }
    return session.tenantId;
}

export async function getSellers(isPublicCall: boolean = false): Promise<SellerProfileInfo[]> {
    const tenantIdToUse = await getTenantIdFromSession(isPublicCall);
    return sellerService.getSellers(tenantIdToUse);
}

export async function getSeller(id: string): Promise<SellerProfileInfo | null> {
    const tenantId = await getTenantIdFromSession();
    return sellerService.getSellerById(tenantId, id);
}

export async function getSellerBySlug(slugOrId: string): Promise<SellerProfileInfo | null> {
    const tenantId = await getTenantIdFromSession(true); // Public data is always from landlord
    return sellerService.getSellerBySlug(tenantId, slugOrId);
}

export async function getLotsBySellerSlug(sellerSlugOrId: string): Promise<Lot[]> {
    const tenantId = await getTenantIdFromSession(true); // Public data is always from landlord
    return sellerService.getLotsBySellerSlug(tenantId, sellerSlugOrId);
}

export async function createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
    const tenantId = await getTenantIdFromSession();
    const result = await sellerService.createSeller(tenantId, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/sellers');
    }
    return result;
}

export async function updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
    const tenantId = await getTenantIdFromSession();
    const result = await sellerService.updateSeller(tenantId, id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/sellers');
        revalidatePath(`/admin/sellers/${id}/edit`);
    }
    return result;
}

export async function deleteSeller(id: string): Promise<{ success: boolean; message: string; }> {
    const tenantId = await getTenantIdFromSession();
    const result = await sellerService.deleteSeller(tenantId, id);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/sellers');
    }
    return result;
}