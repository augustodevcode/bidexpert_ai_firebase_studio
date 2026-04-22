/**
 * @fileoverview Garante que as paginas publicas preservem o identificador da rota resolvida.
 */

import { describe, expect, it } from 'vitest';

import { normalizeAuctionPublicRoute } from '../../src/lib/auctions/public-route';

describe('normalizeAuctionPublicRoute', () => {
  it('overrides stale public identifiers with the resolved route id', () => {
    const auction = normalizeAuctionPublicRoute(
      {
        id: '75',
        publicId: 'auction-equip-1773189171312',
        slug: 'auction-equip-1773189171312',
      },
      'auction-sp-equip-1773189171312',
    );

    expect(auction.publicId).toBe('auction-sp-equip-1773189171312');
    expect(auction.slug).toBe('auction-sp-equip-1773189171312');
  });

  it('keeps the original identifiers when the route id is missing', () => {
    const auction = {
      id: '75',
      publicId: 'auction-equip-1773189171312',
      slug: 'auction-equip-1773189171312',
    };

    expect(normalizeAuctionPublicRoute(auction, '   ')).toBe(auction);
  });
});