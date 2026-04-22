/**
 * @fileoverview Testes unitários para o CTA de login do painel de lances.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BiddingPanel from '@/components/auction/bidding-panel';
import type { Auction, Lot } from '@/types';

let pathname = '/auctions/235/lots/LOTE-0159';

vi.stubGlobal('React', React);

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    React.createElement('a', { href, ...props }, children)
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
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

vi.mock('@/lib/ui-helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ui-helpers')>();
  return {
    __esModule: true,
    ...actual,
    getAuctionStatusText: () => 'Aberto',
    calculateMinimumBid: () => 12232.2,
  };
});

vi.mock('@/lib/auction-timing', () => ({
  __esModule: true,
  getEffectiveAuctionStatus: () => 'ABERTO_PARA_LANCES',
  getEffectiveLotStatus: () => 'ABERTO_PARA_LANCES',
}));

vi.mock('@/components/auction/lot-all-bids-modal', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('@/app/auctions/[auctionId]/lots/[lotId]/actions', () => ({
  __esModule: true,
  placeBidOnLot: vi.fn(),
  placeMaxBid: vi.fn(),
  getActiveUserLotMaxBid: vi.fn(),
  getBidsForLot: vi.fn(),
}));

vi.mock('@/app/admin/habilitations/actions', () => ({
  __esModule: true,
  habilitateForAuctionAction: vi.fn(),
  checkHabilitationForAuctionAction: vi.fn(),
}));

const auction = {
  id: '235',
  publicId: 'AUC-2026-0113',
  title: 'VARA CRIMINAL DE GUAIRA. VEICULOS E SUCATAS',
  status: 'ABERTO_PARA_LANCES',
  auctionType: 'JUDICIAL',
} as unknown as Auction;

const lot = {
  id: '412',
  publicId: 'LOTE-0159',
  auctionId: '235',
  title: 'Lote 1 - Fiat/Uno Mille Way Econ',
  status: 'ABERTO_PARA_LANCES',
  type: 'VEICULO',
  price: 12232.2,
  bidIncrementStep: 100,
} as unknown as Lot;

describe('BiddingPanel login CTA', () => {
  it('preserva a rota atual no link de login do painel de lances', async () => {
    render(
      React.createElement(BiddingPanel, {
        currentLot: lot,
        auction,
        onBidSuccess: vi.fn(),
        sharedBidHistory: [],
      })
    );

    const loginLink = await screen.findByRole('link', { name: /fazer login/i });

    expect(loginLink).toHaveAttribute(
      'href',
      '/auth/login?redirect=%2Fauctions%2F235%2Flots%2FLOTE-0159'
    );
    expect(loginLink).toHaveAttribute('data-ai-id', 'bidding-panel-login-link');
  });
});