// src/app/admin/lots/actions.ts
/**
 * @fileoverview Server Actions para a entidade Lot (Lote).
 * Este arquivo funciona como a camada de Controller para todas as operações
 * de CRUD e outras lógicas de negócio relacionadas a lotes. Ele interage com
 * a LotService e a AssetService para manipular dados, garantindo a aplicação
 * do contexto de tenant e a revalidação de cache do Next.js quando necessário.
 */
'use server';

import type { Lot, Asset, LotFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import { LotService } from '@/services/lot.service';
import { AssetService } from '@/services/asset.service';
import { getTenantIdFromRequest } from '@/lib/actions/auth';

const lotService = new LotService();
const assetService = new AssetService();


export async function getLots(filter?: { auctionId?: string; judicialProcessId?: string }, isPublicCall: boolean = false, limit?: number): Promise<Lot[]> {
  const tenantId = await getTenantIdFromRequest(isPublicCall);
  console.log(`[Action getLots] Tenant: ${tenantId}, Filter:`, filter);
  const lots = await lotService.getLots(filter, tenantId, limit, isPublicCall);
  return JSON.parse(JSON.stringify(lots, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  ));
}

export async function getLot(id: string, isPublicCall: boolean = false): Promise<Lot | null> {
  const tenantId = isPublicCall ? await getTenantIdFromRequest(true) : await getTenantIdFromRequest(false);
  console.log(`[Action getLot] ID: ${id}, Public: ${isPublicCall}, Tenant: ${tenantId}`);
  return lotService.getLotById(id, tenantId, isPublicCall);
}

export async function createLot(data: Partial<LotFormData>): Promise<{ success: boolean; message: string; lotId?: string }> {
  const tenantId = await getTenantIdFromRequest();
  const result = await lotService.createLot(data, tenantId);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/lots');
    if (data.auctionId) {
      revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
    }
  }
  return result;
}

export async function updateLot(id: string, data: Partial<LotFormData>): Promise<{ success: boolean; message: string }> {
  const result = await lotService.updateLot(id, data);
  if (result.success && process.env.NODE_ENV !== 'test') {
      revalidatePath('/admin/lots');
      revalidatePath(`/admin/lots/${id}/edit`);
      if (data.auctionId) {
        revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
      }
  }
  return result;
}

export async function deleteLot(id: string, auctionId?: string): Promise<{ success: boolean; message: string }> {
  const lotToDelete = await lotService.getLotById(id);
  const finalAuctionId = auctionId || lotToDelete?.auctionId;

  const result = await lotService.deleteLot(id);
  
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/lots');
    if (finalAuctionId) {
      revalidatePath(`/admin/auctions/${finalAuctionId}/edit`);
    }
  }
  return result;
}

export async function getAssetsForLotting(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Asset[]> {
    const tenantId = await getTenantIdFromRequest();
    return assetService.getAssets({ ...filter, tenantId });
}

export async function getAssetsByIdsAction(ids: string[]): Promise<Asset[]> {
  return assetService.getAssetsByIds(ids);
}

export async function getLotsByIds(ids: string[]): Promise<Lot[]> {
  return lotService.getLotsByIds(ids);
}

export async function finalizeLot(lotId: string): Promise<{ success: boolean; message: string }> {
  const result = await lotService.finalizeLot(lotId);
  if (result.success && process.env.NODE_ENV !== 'test') {
    const lot = await lotService.getLotById(lotId);
    if(lot) {
      revalidatePath(`/admin/lots/${lotId}/edit`);
      revalidatePath(`/admin/auctions/${lot.auctionId}/edit`);
    }
  }
  return result;
}


export async function updateLotFeaturedStatus(id: string, isFeatured: boolean): Promise<{ success: boolean, message: string }> {
  return updateLot(id, { isFeatured });
}

export async function updateLotTitle(id: string, title: string): Promise<{ success: boolean, message: string }> {
  return updateLot(id, { title });
}

export async function updateLotImage(id: string, mediaItemId: string, imageUrl: string): Promise<{ success: boolean, message: string }> {
  return updateLot(id, { imageMediaId: mediaItemId, imageUrl });
}

/**
 * Atualiza o status de múltiplos lotes de uma vez (Mass Action).
 * @param lotIds Array de IDs dos lotes a serem atualizados
 * @param newStatus Novo status a ser aplicado (ex: 'SUSPENSO', 'ABERTO_PARA_LANCES')
 * @returns Resultado da operação em massa
 */
export async function updateLotsStatusBulk(
  lotIds: string[], 
  newStatus: string
): Promise<{ success: boolean; message: string; updatedCount: number; failedCount: number }> {
  const tenantId = await getTenantIdFromRequest();
  let updatedCount = 0;
  let failedCount = 0;
  
  for (const lotId of lotIds) {
    try {
      const result = await lotService.updateLot(lotId, { status: newStatus as any });
      if (result.success) {
        updatedCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      console.error(`[Mass Action] Falha ao atualizar lote ${lotId}:`, error);
      failedCount++;
    }
  }
  
  if (process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/lots');
  }
  
  return {
    success: failedCount === 0,
    message: `${updatedCount} lote(s) atualizado(s), ${failedCount} falha(s).`,
    updatedCount,
    failedCount,
  };
}

/**
 * Deleta múltiplos lotes de uma vez (Mass Action).
 * @param lotIds Array de IDs dos lotes a serem deletados
 * @returns Resultado da operação em massa
 */
export async function deleteLotsInBulk(
  lotIds: string[]
): Promise<{ success: boolean; message: string; deletedCount: number; failedCount: number }> {
  let deletedCount = 0;
  let failedCount = 0;
  
  for (const lotId of lotIds) {
    try {
      const result = await lotService.deleteLot(lotId);
      if (result.success) {
        deletedCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      console.error(`[Mass Action] Falha ao deletar lote ${lotId}:`, error);
      failedCount++;
    }
  }
  
  if (process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/lots');
  }
  
  return {
    success: failedCount === 0,
    message: `${deletedCount} lote(s) excluído(s), ${failedCount} falha(s).`,
    deletedCount,
    failedCount,
  };
}
