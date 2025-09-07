// src/app/admin/auctioneers/actions.ts
'use server';

import { AuctioneerService } from '@/services/auctioneer.service';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const auctioneerService = new AuctioneerService();
const auctioneerActions = createCrudActions({
  service: auctioneerService,
  entityName: 'Auctioneer',
  entityNamePlural: 'Auctioneers',
  routeBase: '/admin/auctioneers',
});

export const {
  getAll: getAuctioneers,
  getById: getAuctioneer,
  getBySlug: getAuctioneerBySlug,
  create: createAuctioneer,
  update: updateAuctioneer,
  delete: deleteAuctioneer,
} = auctioneerActions;

// Funções específicas que não se encaixam no CRUD padrão permanecem aqui
export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string) {
    return auctioneerService.getAuctionsByAuctioneerSlug(auctioneerSlug);
}

export async function getAuctioneerDashboardDataAction(auctioneerId: string) {
    return auctioneerService.getAuctioneerDashboardData(auctioneerId);
}
