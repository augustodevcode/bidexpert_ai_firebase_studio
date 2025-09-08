// src/app/admin/lots/actions.ts
'use server';

import { LotService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';
import type { Lot, LotFormData } from '@bidexpert/core';
import { revalidatePath } from 'next/cache';

const lotService = new LotService();
const lotActions = createCrudActions({
  service: lotService,
  entityName: 'Lot',
  entityNamePlural: 'Lots',
  routeBase: '/admin/lots',
});

export const {
  getAll: getLots,
  getById: getLot,
  create: createLot,
  update: updateLot,
  delete: deleteLot,
} = lotActions;

// --- Ações Específicas que não se encaixam no CRUD padrão ---

export async function getBensByIdsAction(ids: string[]) {
    // This action doesn't fit the CRUD pattern as it queries a different entity.
    // Ideally, this should also go through a service if it has business logic.
    // For now, it remains here as it's a direct passthrough.
    const { getBensByIds } = await import('@/lib/data-queries');
    return getBensByIds(ids);
}


export async function getLotsByIds(ids: string[]): Promise<Lot[]> {
  return lotService.getLotsByIds(ids);
}

export async function finalizeLot(lotId: string): Promise<{ success: boolean; message: string }> {
  return lotService.finalizeLot(lotId);
}

export async function updateLotFeaturedStatus(id: string, isFeatured: boolean): Promise<{ success: boolean, message: string }> {
  const result = await lotService.updateLot(id, { isFeatured });
    if (result.success) {
        revalidatePath('/admin/lots');
        revalidatePath(`/admin/lots/${id}/edit`);
    }
    return result;
}

export async function updateLotTitle(id: string, title: string): Promise<{ success: boolean, message: string }> {
  const result = await lotService.updateLot(id, { title });
    if (result.success) {
        revalidatePath('/admin/lots');
        revalidatePath(`/admin/lots/${id}/edit`);
    }
    return result;
}

export async function updateLotImage(id: string, mediaItemId: string, imageUrl: string): Promise<{ success: boolean, message: string }> {
  const result = await lotService.updateLot(id, { imageMediaId: mediaItemId, imageUrl });
    if (result.success) {
        revalidatePath('/admin/lots');
        revalidatePath(`/admin/lots/${id}/edit`);
    }
    return result;
}
