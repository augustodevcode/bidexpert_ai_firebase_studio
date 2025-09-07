// src/app/admin/sellers/actions.ts
'use server';

import type { SellerFormData } from '@/types';
import { SellerService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const sellerService = new SellerService();
const sellerActions = createCrudActions({
  service: sellerService,
  entityName: 'Seller',
  entityNamePlural: 'Sellers',
  routeBase: '/admin/sellers',
});

// Export a função getSellers com o nome original para manter compatibilidade
export const getSellers = sellerActions.getAll;

export const {
  getById: getSeller,
  getBySlug: getSellerBySlug,
  create: createSeller,
  update: updateSeller,
  delete: deleteSeller
} = sellerActions;

// Funções específicas que não se encaixam no CRUD padrão permanecem aqui
export async function getLotsBySellerSlug(sellerSlugOrId: string) {
    return sellerService.getLotsBySellerSlug(sellerSlugOrId);
}
