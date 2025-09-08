
// src/app/admin/lots/actions.ts
'use server';

import { LotService, BemService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';
import type { Lot, LotFormData } from '@bidexpert/core';

const lotService = new LotService();
const bemService = new BemService();

const {
  obterTodos: getLots,
  obterPorId: getLot,
  criar: createLot,
  atualizar: updateLot,
  excluir: deleteLot,
} = createCrudActions({
  service: lotService,
  entityName: 'Lote',
  entityNamePlural: 'Lotes',
  routeBase: '/admin/lots',
});

export { getLots, getLot, createLot, updateLot, deleteLot };


// --- Ações Específicas que não se encaixam no CRUD padrão ---
export async function getBensByIdsAction(ids: string[]) {
    return bemService.getBensByIds(ids);
}

export async function getLotsByIds(ids: string[]): Promise<Lot[]> {
  return lotService.getLotsByIds(ids);
}

export async function finalizeLot(lotId: string): Promise<{ success: boolean; message: string }> {
  return lotService.finalizeLot(lotId);
}

export async function updateLotFeaturedStatus(id: string, isFeatured: boolean): Promise<{ success: boolean, message: string }> {
  return lotService.updateLotFeaturedStatus(id, isFeatured);
}

export async function updateLotTitle(id: string, title: string): Promise<{ success: boolean, message: string }> {
  return lotService.updateLotTitle(id, title);
}

export async function updateLotImage(id: string, mediaItemId: string, imageUrl: string): Promise<{ success: boolean, message: string }> {
    return lotService.updateLotImage(id, mediaItemId, imageUrl);
}
