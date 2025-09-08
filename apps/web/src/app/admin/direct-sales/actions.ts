
// src/app/admin/direct-sales/actions.ts
'use server';

import { DirectSaleOfferService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const offerService = new DirectSaleOfferService();

const { 
  obterTodos: getDirectSaleOffers, 
  obterPorId: getDirectSaleOffer, 
  criar: createDirectSaleOffer, 
  atualizar: updateDirectSaleOffer, 
  excluir: deleteDirectSaleOffer 
} = createCrudActions({
  service: offerService,
  entityName: 'Oferta de Venda Direta',
  routeBase: '/admin/direct-sales',
});


export { getDirectSaleOffers, getDirectSaleOffer, createDirectSaleOffer, updateDirectSaleOffer, deleteDirectSaleOffer };
