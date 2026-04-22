/**
 * @fileoverview Normaliza o identificador publico do leilao para a rota efetivamente resolvida.
 */

import type { Auction } from '@/types';

type AuctionRouteIdentity = Partial<Pick<Auction, 'publicId' | 'slug'>>;

export function normalizeAuctionPublicRoute<T extends AuctionRouteIdentity>(auction: T, routeAuctionId?: string | null): T {
  const normalizedRouteId = typeof routeAuctionId === 'string' ? routeAuctionId.trim() : '';

  if (!normalizedRouteId) {
    return auction;
  }

  return {
    ...auction,
    publicId: normalizedRouteId,
    slug: normalizedRouteId,
  };
}