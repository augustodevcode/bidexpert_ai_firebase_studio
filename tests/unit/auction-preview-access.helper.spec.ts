/**
 * @fileoverview Garante o modo de fetch correto para preview autenticado das rotas publicas.
 */

import { describe, expect, it } from 'vitest';

import { canPreviewNonPublicAuction, shouldUsePublicAuctionData } from '../../src/lib/auctions/preview-access';
import type { UserProfileWithPermissions } from '../../src/types';

function createUserWithPermissions(permissions: string[]): UserProfileWithPermissions {
  return {
    permissions,
    roles: [],
    tenants: [],
    roleNames: [],
  } as unknown as UserProfileWithPermissions;
}

describe('auction preview access', () => {
  it('keeps guest users on public data mode', () => {
    expect(canPreviewNonPublicAuction(null)).toBe(false);
    expect(shouldUsePublicAuctionData(null)).toBe(true);
  });

  it('keeps bidder-style users on public data mode', () => {
    const bidder = createUserWithPermissions(['view_auctions']);

    expect(canPreviewNonPublicAuction(bidder)).toBe(false);
    expect(shouldUsePublicAuctionData(bidder)).toBe(true);
  });

  it('allows admin-like users to preview non-public auctions', () => {
    const admin = createUserWithPermissions(['manage_auctions']);

    expect(canPreviewNonPublicAuction(admin)).toBe(true);
    expect(shouldUsePublicAuctionData(admin)).toBe(false);
  });

  it('allows assigned auction staff to preview non-public auctions', () => {
    const auctioneer = createUserWithPermissions(['auctions:manage_assigned']);

    expect(canPreviewNonPublicAuction(auctioneer)).toBe(true);
    expect(shouldUsePublicAuctionData(auctioneer)).toBe(false);
  });
});