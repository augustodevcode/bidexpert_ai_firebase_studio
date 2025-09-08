
// src/app/admin/sellers/actions.ts
'use server';

import type { SellerFormData, SellerProfileInfo } from '@bidexpert/core';
import { SellerService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const sellerService = new SellerService();
const { 
  obterTodos: getComitentes, 
  obterPorId: getComitente,
  obterPorSlug: getComitentePorSlug, 
  criar: criarComitente, 
  atualizar: atualizarComitente, 
  excluir: deletarComitente 
} = createCrudActions({
  service: sellerService,
  entityName: 'Comitente',
  routeBase: '/admin/sellers',
});

export { 
  getComitentes, 
  getComitente,
  getComitentePorSlug, 
  criarComitente, 
  atualizarComitente, 
  deletarComitente 
};


// Funções específicas que não se encaixam no CRUD padrão permanecem aqui
export async function getLotesPorComitenteSlug(sellerSlugOrId: string) {
    return sellerService.getLotsBySellerSlug(sellerSlugOrId);
}
