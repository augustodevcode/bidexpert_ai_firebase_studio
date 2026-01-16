import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuctionListItem from '@/components/cards/auction-list-item';
import type { Auction } from '@/types';

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
  title: 'Tomada Pública 2025',
  auctionType: 'TOMADA_DE_PRECOS',
  status: 'EM_BREVE',
  auctionDate: new Date().toISOString(),
  totalLots: 4,
  totalHabilitatedUsers: 12,
  visits: 25,
  initialOffer: 100000,
  seller: {
    name: 'Comitente XPTO',
    logoUrl: null,
  },
} as unknown as Auction;

describe('AuctionListItem', () => {
  it('renderiza lotes de tomada de preços com o selo correto', () => {
    render(<AuctionListItem auction={baseAuction} />);
    expect(screen.getByText('Tomada de Preços')).toBeInTheDocument();
  });

  it('aplica o modo compacto sem renderizar a timeline', () => {
    const auctionWithStages = {
      ...baseAuction,
      auctionStages: [{ id: 'stage-1' } as any],
      auctionDate: new Date().toISOString(),
    } as Auction;

    const { container } = render(<AuctionListItem auction={auctionWithStages} density="compact" />);

    expect(container.querySelector('[data-density="compact"]')).toBeTruthy();
    expect(screen.getByTestId('timeline')).toBeInTheDocument();
  });
});
