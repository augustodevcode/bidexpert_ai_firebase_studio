// src/app/admin/auctioneers/actions.ts
'use server';

import { AuctioneerService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const auctioneerService = new AuctioneerService();

const { 
  obterTodos: getAuctioneers, 
  obterPorId: getAuctioneer,
  obterPorSlug: getAuctioneerBySlug, 
  criar: createAuctioneer, 
  atualizar: updateAuctioneer, 
  excluir: deleteAuctioneer 
} = createCrudActions({
  service: auctioneerService,
  entityName: 'Leiloeiro',
  routeBase: '/admin/auctioneers',
});

export { 
  getAuctioneers, 
  getAuctioneer,
  getAuctioneerBySlug, 
  createAuctioneer, 
  updateAuctioneer, 
  deleteAuctioneer 
};


// Funções específicas que não se encaixam no CRUD padrão permanecem aqui
export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string) {
    return auctioneerService.getAuctionsByAuctioneerSlug(auctioneerSlug);
}
