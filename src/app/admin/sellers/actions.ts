// src/app/admin/sellers/actions.ts
/**
 * @fileoverview Server Actions para a entidade Seller (Comitente).
 * Este arquivo funciona como a camada de Controller, expondo funções que o cliente
 * pode chamar para executar operações de CRUD (Criar, Ler, Atualizar, Excluir)
 * nos comitentes. Ele delega a lógica de negócio para a `SellerService` e garante
 * a aplicação do isolamento de dados por tenant e a revalidação do cache do Next.js
 * quando ocorrem mutações.
 */
'use server';

import { revalidatePath } from 'next/cache';
import type { SellerProfileInfo, SellerFormData, Lot } from '@/types';
import { SellerService } from '@/services/seller.service';
import { getTenantIdFromRequest } from '@/lib/actions/auth';

const sellerService = new SellerService();


export async function getSellers(isPublicCall: boolean = false, limit?: number): Promise<SellerProfileInfo[]> {
    const tenantIdToUse = await getTenantIdFromRequest(isPublicCall);
    return sellerService.getSellers(tenantIdToUse, limit);
}

export async function getSeller(id: string): Promise<SellerProfileInfo | null> {
    const tenantId = await getTenantIdFromRequest();
    return sellerService.getSellerById(tenantId, id);
}

export async function getSellerBySlug(slugOrId: string): Promise<SellerProfileInfo | null> {
    const tenantId = await getTenantIdFromRequest(true); // Public data is always from landlord
    return sellerService.getSellerBySlug(tenantId, slugOrId);
}

export async function createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await sellerService.createSeller(tenantId, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/sellers');
    }
    return result;
}

export async function updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await sellerService.updateSeller(tenantId, id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/sellers');
        revalidatePath(`/admin/sellers/${id}/edit`);
    }
    return result;
}

export async function deleteSeller(id: string): Promise<{ success: boolean; message: string; }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await sellerService.deleteSeller(tenantId, id);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/sellers');
    }
    return result;
}
