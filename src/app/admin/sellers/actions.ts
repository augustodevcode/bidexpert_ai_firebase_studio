
// src/app/admin/sellers/actions.ts
'use server';

import type { SellerFormData, SellerProfileInfo, Lot } from '@bidexpert/core';
import { SellerService, LotService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const sellerService = new SellerService();
const lotService = new LotService();

const { 
  obterTodos: getSellers, 
  obterPorId: getSeller,
  obterPorSlug: getSellerBySlug, 
  criar: createSeller, 
  atualizar: updateSeller, 
  excluir: deleteSeller 
} = createCrudActions({
  service: sellerService,
  entityName: 'Comitente',
  routeBase: '/admin/sellers',
});

export { 
  getSellers, 
  getSeller,
  getSellerBySlug, 
  createSeller, 
  updateSeller, 
  deleteSeller 
};


// Funções específicas que não se encaixam no CRUD padrão permanecem aqui
export async function getLotsBySellerSlug(sellerSlugOrId: string): Promise<Lot[]> {
    return lotService.getLotsForConsignor(sellerSlugOr