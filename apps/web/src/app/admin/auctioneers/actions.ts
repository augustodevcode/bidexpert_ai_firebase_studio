// src/app/admin/auctioneers/actions.ts
'use server';

import type { AuctioneerFormData } from '@bidexpert/core';
import { AuctioneerService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const auctioneerService = new AuctioneerService();
const auctioneerActions = createCrudActions({
  service: auctioneerService,
  entityName: 'Auctioneer',
  entityNamePlural: 'Auctioneers',
  routeBase: '/admin/auctioneers',
});

export const {
  getAll: getLeiloeiros,
  getById: getLeiloeiro,
  getBySlug: getLeiloeiroPorSlug,
  create: criarLeiloeiro,
  update: atualizarLeiloeiro,
  delete: deletarLeiloeiro,
} = auctioneerActions;

// Funções específicas que não se encaixam no CRUD padrão permanecem aqui
export async function getLeiloesPorLeiloeiroSlug(auctioneerSlug: string) {
    return auctioneerService.getAuctionsByAuctioneerSlug(auctioneerSlug);
}
