// src/app/admin/sellers/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { SellerProfileInfo, SellerFormData, Lot } from '@/types';
import { SellerService } from '@/services/seller.service';

const sellerService = new SellerService();

export async function getSellers(): Promise<SellerProfileInfo[]> {
    return sellerService.getSellers();
}

export async function getSeller(id: string): Promise<SellerProfileInfo | null> {
    return sellerService.getSellerById(id);
}

export async function getSellerBySlug(slugOrId: string): Promise<SellerProfileInfo | null> {
    return sellerService.getSellerBySlug(slugOrId);
}

export async function getLotsBySellerSlug(sellerSlugOrId: string): Promise<Lot[]> {
    return sellerService.getLotsBySellerSlug(sellerSlugOrId);
}

export async function createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
    const result = await sellerService.createSeller(data);
    if (result.success) {
        revalidatePath('/admin/sellers');
    }
    return result;
}

export async function updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
    const result = await sellerService.updateSeller(id, data);
    if (result.success) {
        revalidatePath('/admin/sellers');
        revalidatePath(`/admin/sellers/${id}/edit`);
    }
    return result;
}

export async function deleteSeller(id: string): Promise<{ success: boolean; message: string; }> {
    const result = await sellerService.deleteSeller(id);
    if (result.success) {
        revalidatePath('/admin/sellers');
    }
    return result;
}
