/**
 * @fileoverview Testes unitários para garantir que o LotCard sempre renderiza
 * a visualização de praças/etapas via BidExpertAuctionStagesTimeline.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LotCard from '@/components/cards/lot-card';
import type { Auction, Lot, PlatformSettings } from '@/types';

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} data-testid="next-image" />
  ),
}));

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="next-link">
      {children}
    </a>
  ),
}));

vi.mock('@/components/auction/BidExpertAuctionStagesTimeline', () => ({
  __esModule: true,
  default: () => <div data-testid="timeline" />,
}));

vi.mock('@/components/lot-preview-modal-v2', () => ({
  __esModule: true,
  default: () => <div data-testid="lot-preview-modal" />,
}));

vi.mock('@/components/consignor-logo-badge', () => ({
  __esModule: true,
  default: () => <div data-testid="consignor-logo" />,
}));

vi.mock('@/components/entity-edit-menu', () => ({
  __esModule: true,
  default: () => <div data-testid="entity-edit-menu" />,
}));

vi.mock('@/hooks/use-toast', () => ({
  __esModule: true,
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/contexts/auth-context', () => ({
  __esModule: true,
  useAuth: () => ({ userProfileWithPermissions: null }),
}));

vi.mock('@/lib/permissions', () => ({
  __esModule: true,
  hasPermission: () => false,
}));

vi.mock('@/lib/favorite-store', () => ({
  __esModule: true,
  isLotFavoriteInStorage: () => false,
  addFavoriteLotIdToStorage: () => undefined,
  removeFavoriteLotIdFromStorage: () => undefined,
}));

vi.mock('@/lib/recently-viewed-store', () => ({
  __esModule: true,
  getRecentlyViewedIds: () => [],
}));

vi.mock('@/lib/ui-helpers', async () => {
  const actual = await vi.importActual<any>('@/lib/ui-helpers');
  return {
    __esModule: true,
    ...actual,
    isValidImageUrl: () => true,
    getAuctionStatusText: () => 'Aberto',
    getLotStatusColor: () => 'bg-green-600 text-white',
    getEffectiveLotEndDate: () => ({ effectiveLotEndDate: null }),
    getActiveStage: () => null,
    getLotPriceForStage: () => null,
    getAuctionTypeDisplayData: () => ({ label: 'Judicial', icon: null }),
  };
});

const baseAuction = {
  id: 'auction-001',
  publicId: 'AUC-001',
  title: 'Leilão de Imóveis',
  auctionType: 'JUDICIAL',
  status: 'ABERTO_PARA_LANCES',
  auctionDate: new Date().toISOString(),
  auctionStages: [{ id: 'stage-1' } as any],
  seller: { name: 'Comitente XPTO', logoUrl: null },
} as unknown as Auction;

const baseLot = {
  id: 'lot-001',
  publicId: 'LOT-001',
  title: 'Apartamento 2Q',
  auctionId: baseAuction.id,
  status: 'ABERTO_PARA_LANCES',
  type: 'IMOVEL',
  cityName: 'São Paulo',
  stateUf: 'SP',
  price: 100000,
  number: '001',
  lotPrices: [],
} as unknown as Lot;

const platformSettings = {
  sectionBadgeVisibility: {
    searchGrid: {
      showStatusBadge: true,
      showDiscountBadge: true,
      showUrgencyTimer: true,
      showPopularityBadge: true,
      showHotBidBadge: true,
      showExclusiveBadge: true,
    },
  },
  showCountdownOnCards: false,
  mentalTriggerSettings: {
    showDiscountBadge: false,
    showPopularityBadge: false,
    showHotBidBadge: false,
    showExclusiveBadge: false,
  },
} as unknown as PlatformSettings;

describe('LotCard timeline', () => {
  it('renderiza a timeline de praças no card do lote', async () => {
    render(<LotCard lot={baseLot} auction={baseAuction} platformSettings={platformSettings} />);

    // LotCard monta um skeleton no primeiro render e depois ativa o client state.
    // A presence do mock "timeline" deve aparecer após o effect.
    expect(await screen.findByTestId('timeline')).toBeInTheDocument();
  });
});
