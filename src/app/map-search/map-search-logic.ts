// src/app/map-search/map-search-logic.ts
/**
 * @fileoverview Funções puras para seleção e filtragem de datasets na busca por mapa.
 */

import type { Auction, DirectSaleOffer, Lot } from '@/types';

export type MapSearchDataset = 'lots' | 'direct_sale' | 'tomada_de_precos';
export type MapSearchEntity = Lot | Auction | DirectSaleOffer;

interface SelectDatasetItemsParams {
  dataset: MapSearchDataset;
  lots: Lot[];
  auctions: Auction[];
  directSales: DirectSaleOffer[];
}

export function resolveDatasetFromParam(value: string | null | undefined): MapSearchDataset {
  if (value === 'direct_sale' || value === 'tomada_de_precos') {
    return value;
  }
  return 'lots';
}

export function selectDatasetItems({ dataset, lots, auctions, directSales }: SelectDatasetItemsParams): MapSearchEntity[] {
  if (dataset === 'lots') {
    return lots.filter(lot => lot.auction?.auctionType !== 'TOMADA_DE_PRECOS');
  }
  if (dataset === 'direct_sale') {
    return directSales.filter(offer => offer.status === 'ACTIVE');
  }
  return auctions.filter(auction => auction.auctionType === 'TOMADA_DE_PRECOS');
}

export function buildSearchableText(item: MapSearchEntity): string {
  const pieces: string[] = [item.title ?? ''];
  if ('description' in item && item.description) pieces.push(item.description);
  if ('auction' in item && item.auction?.title) pieces.push(item.auction.title);
  if ('sellerName' in item && item.sellerName) pieces.push(item.sellerName);
  if ('seller' in item && item.seller?.name) pieces.push(item.seller.name);
  if ('cityName' in item && item.cityName) pieces.push(item.cityName);
  if ('stateUf' in item && item.stateUf) pieces.push(item.stateUf);
  if ('locationCity' in item && item.locationCity) pieces.push(item.locationCity);
  if ('locationState' in item && item.locationState) pieces.push(item.locationState);
  return pieces.join(' ').toLowerCase();
}

export function filterBySearchTerm(items: MapSearchEntity[], term: string): MapSearchEntity[] {
  const normalized = term.trim().toLowerCase();
  if (!normalized) {
    return items;
  }
  return items.filter(item => buildSearchableText(item).includes(normalized));
}

export function filterByVisibleIds(items: MapSearchEntity[], visibleIds: string[] | null): MapSearchEntity[] {
  if (visibleIds === null) {
    return items;
  }
  const normalized = new Set(visibleIds.map(id => id.toString()));
  return items.filter(item => normalized.has(item.id.toString()));
}
