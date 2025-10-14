// src/app/admin/auctioneers/actions.ts
/**
 * @fileoverview Server Actions para a entidade Auctioneer (Leiloeiro).
 * Este arquivo exporta funções que lidam com a criação, leitura, atualização,
 * e exclusão (CRUD) de leiloeiros, atuando como a camada de Controller que
 * interage com a AuctioneerService e lida com o contexto de tenant e revalidação de cache.
 */
'use server';

import type { AuctioneerProfileInfo, AuctioneerFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import { AuctioneerService } from '@/services/auctioneer.service';
import { getTenantIdFromRequest } from '@/lib/actions/auth';

const auctioneerService = new AuctioneerService();


export async function getAuctioneers(isPublicCall: boolean = false, limit?: number): Promise<AuctioneerProfileInfo[]> {
  const tenantIdToUse = await getTenantIdFromRequest(isPublicCall);
  return auctioneerService.getAuctioneers(tenantIdToUse, limit);
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
