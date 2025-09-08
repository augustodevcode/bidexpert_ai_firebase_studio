// src/app/admin/auctioneers/actions.ts
'use server';

import { AuctioneerService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const auctioneerService = new AuctioneerService();

const { 
  obterTodos: obterLeiloeiros, 
  obterPorId: obterLeiloeiro,
  obterPorSlug: obterLeiloeiroPorSlug, 
  criar: criarLeiloeiro, 
  atualizar: atualizarLeiloeiro, 
  excluir: excluirLeiloeiro 
} = createCrudActions({
  service: auctioneerService,
  entityName: 'Leiloeiro',
  routeBase: '/admin/auctioneers',
});

export { 
  obterLeiloeiros, 
  obterLeiloeiro,
  obterLeiloeiroPorSlug, 
  criarLeiloeiro, 
  atualizarLeiloeiro, 
  excluirLeiloeiro 
};


// Funções específicas que não se encaixam no CRUD padrão permanecem aqui
export async function obterLeiloesPorLeiloeiroSlug(auctioneerSlug: string) {
    return auctioneerService.obterLeiloesPorLeiloeiroSlug(auctioneerSlug);
}
