/**
 * @fileoverview Regras compartilhadas para decidir quando uma rota publica
 * pode buscar dados em modo de preview autenticado.
 */
import type { UserProfileWithPermissions } from '@/types';

import { hasAnyPermission } from '@/lib/permissions';

const NON_PUBLIC_AUCTION_PREVIEW_PERMISSIONS = [
  'manage_all',
  'manage_auctions',
  'manage_lots',
  'auctions:update',
  'lots:update',
  'auctions:publish',
  'auctions:manage_own',
  'auctions:manage_assigned',
  'lots:manage_own',
  'conduct_auctions',
];

export function canPreviewNonPublicAuction(user: UserProfileWithPermissions | null): boolean {
  return hasAnyPermission(user, NON_PUBLIC_AUCTION_PREVIEW_PERMISSIONS);
}

export function shouldUsePublicAuctionData(user: UserProfileWithPermissions | null): boolean {
  return !canPreviewNonPublicAuction(user);
}