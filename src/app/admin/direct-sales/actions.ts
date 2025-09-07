// src/app/admin/direct-sales/actions.ts
'use server';

import { DirectSaleOfferService } from '@/services/direct-sale-offer.service';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const offerService = new DirectSaleOfferService();
const offerActions = createCrudActions({
  service: offerService,
  entityName: 'DirectSaleOffer',
  entityNamePlural: 'DirectSaleOffers',
  routeBase: '/admin/direct-sales',
});


export const {
  getAll: getDirectSaleOffers,
  getById: getDirectSaleOffer,
  create: createDirectSaleOffer,
  update: updateDirectSaleOffer,
  delete: deleteDirectSaleOffer,
} = offerActions;
