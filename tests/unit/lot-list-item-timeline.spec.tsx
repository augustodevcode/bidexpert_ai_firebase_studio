/**
 * @fileoverview Testes unitários para garantir que o LotListItem sempre renderiza
 * a visualização de praças/etapas via BidExpertAuctionStagesTimeline (inclusive no modo compacto).
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LotListItem from '@/components/cards/lot-list-item';
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

vi.mock('@/components/entity-edit-menu', () => ({
  __esModule: true,
  default: () => <div data-testid="entity-edit-menu" />,
}));

vi.mock('@/components/consignor-logo-badge', () => ({
  __esModule: true,
  default: () => <div data-testid="consignor-logo" />,
}));

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
} as unknown as Lot;

const platformSettings = {
  showCountdownOnCards: true,
} as unknown as PlatformSettings;

describe('LotListItem timeline', () => {
  it('renderiza timeline no modo padrão', () => {
    render(<LotListItem lot={baseLot} auction={baseAuction} platformSettings={platformSettings} />);
    expect(screen.getByTestId('timeline')).toBeInTheDocument();
  });

  it('renderiza timeline no modo compacto', () => {
    render(<LotListItem lot={baseLot} auction={baseAuction} platformSettings={platformSettings} density="compact" />);
    expect(screen.getByTestId('timeline')).toBeInTheDocument();
  });
});
