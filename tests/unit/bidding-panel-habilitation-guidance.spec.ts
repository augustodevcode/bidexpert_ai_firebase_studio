/**
 * @fileoverview Cobre a orientação inline de habilitação e documentação no painel de lances.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BiddingPanel from '@/components/auction/bidding-panel';
import type { Auction, Lot } from '@/types';

let pathname = '/auctions/239/lots/LOTE-0163';
let mockedUserProfile: any = null;

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
  useAuth: () => ({ userProfileWithPermissions: mockedUserProfile }),
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
  getActiveUserLotMaxBid: vi.fn().mockResolvedValue(null),
  getBidsForLot: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/app/admin/habilitations/actions', () => ({
  __esModule: true,
  habilitateForAuctionAction: vi.fn().mockResolvedValue({ success: true, message: 'ok' }),
  checkHabilitationForAuctionAction: vi.fn(),
}));

const auction = {
  id: '239',
  publicId: 'AUC-2026-0117',
  title: '1ª Vara Cível da Comarca de Jaboticabal/SP',
  status: 'ABERTO_PARA_LANCES',
  auctionType: 'JUDICIAL',
} as unknown as Auction;

const lot = {
  id: '412',
  publicId: 'LOTE-0163',
  auctionId: '239',
  title: 'Fiat/Uno Mille Way Econ, 09/10, cor prata',
  status: 'ABERTO_PARA_LANCES',
  type: 'VEICULO',
  price: 12232.2,
  bidIncrementStep: 100,
} as unknown as Lot;

describe('BiddingPanel habilitation guidance', () => {
  it('mostra orientação para documentos pendentes com CTA para Meus Documentos', async () => {
    mockedUserProfile = {
      id: '77',
      email: 'pendente@bidexpert.com.br',
      fullName: 'Usuário Pendente',
      habilitationStatus: 'PENDING_ANALYSIS',
    };

    render(
      React.createElement(BiddingPanel, {
        currentLot: lot,
        auction,
        onBidSuccess: vi.fn(),
        isHabilitadoForThisAuction: false,
        sharedBidHistory: [],
      })
    );

    expect(await screen.findByRole('heading', { name: /documentação em análise/i, level: 5 })).toBeInTheDocument();
    const documentsLink = await screen.findByRole('link', { name: /acompanhar análise dos documentos/i });
    expect(documentsLink).toHaveAttribute('href', '/dashboard/documents');
    expect(documentsLink).toHaveAttribute('data-ai-id', 'bidding-panel-documents-link');
  });

  it('mostra orientação inline quando falta apenas a habilitação do leilão', async () => {
    mockedUserProfile = {
      id: '88',
      email: 'analista@lordland.com',
      fullName: 'Analista Demo',
      habilitationStatus: 'HABILITADO',
    };

    render(
      React.createElement(BiddingPanel, {
        currentLot: lot,
        auction,
        onBidSuccess: vi.fn(),
        isHabilitadoForThisAuction: false,
        sharedBidHistory: [],
      })
    );

    expect(await screen.findByText(/habilite-se para participar/i)).toBeInTheDocument();
    expect(screen.getByText(/cadastro documental pronto/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /habilitar-se para este leilão/i })).toHaveAttribute('data-ai-id', 'bidding-panel-habilitate-action');
    expect(screen.getByRole('link', { name: /revisar meus documentos/i })).toHaveAttribute('data-ai-id', 'bidding-panel-documents-review-link');
  });
});