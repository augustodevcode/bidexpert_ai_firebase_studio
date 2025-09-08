// src/app/admin/sellers/actions.ts
'use server';

import type { SellerFormData } from '@bidexpert/core';
import { SellerService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const sellerService = new SellerService();
const sellerActions = createCrudActions({
  service: sellerService,
  entityName: 'Seller',
  entityNamePlural: 'Sellers',
  routeBase: '/admin/sellers',
});

export const {
  getAll: getComitentes,
  getById: getComitente,
  getBySlug: getComitentePorSlug,
  create: criarComitente,
  update: atualizarComitente,
  delete: deletarComitente,
} = sellerActions;

// Funções específicas que não se encaixam no CRUD padrão permanecem aqui
export async function getLotesPorComitenteSlug(sellerSlugOrId: string) {
    return sellerService.getLotsBySellerSlug(sellerSlugOrId);
}
