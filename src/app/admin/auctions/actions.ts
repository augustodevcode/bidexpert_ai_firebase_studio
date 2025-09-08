// src/app/admin/auctions/actions.ts
'use server';

import type { Auction, AuctionFormData } from '@bidexpert/core';
import { AuctionService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';


const auctionService = new AuctionService();
const {
  obterTodos: getAuctions,
  obterPorId: getAuction,
  criar: createAuction,
  atualizar: updateAuction,
  excluir: deleteAuction,
} = createCrudActions({
  service: auctionService,
  entityName: 'Leilão',
  entityNamePlural: 'Leilões',
  routeBase: '/admin/auctions',
});

export { getAuctions, getAuction, createAuction, updateAuction, deleteAuction };

// --- Ações Específicas que não se encaixam no CRUD padrão ---

export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string) {
    return auctionService.getAuctionsByAuctioneerSlug(auctioneerSlug);
}

export async function updateAuctionTitle(id: string, newTitle: string): Promise<{ success: boolean; message: string; }> {
    return auctionService.updateAuctionTitle(id, newTitle);
}

export async function updateAuctionImage(auctionId: string, mediaItemId: string, imageUrl: string): Promise<{ success: boolean; message: string; }> {
    return auctionService.updateAuctionImage(auctionId, mediaItemId, imageUrl);
}

export async function updateAuctionFeaturedStatus(id: string, newStatus: boolean): Promise<{ success: boolean; message: string; }> {
    return auctionService.updateAuctionFeaturedStatus(id, newStatus);
}

export async function getAuctionsByIds(ids: string[]): Promise<Auction[]> {
    if (ids.length === 0) return [];
    return auctionService.getAuctionsByIds(ids);
}
