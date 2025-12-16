// tests/unit/auction-preparation/dashboard-tab.spec.tsx
/**
 * @fileoverview Garante que o atalho de edição da central de leilões aponta para a rota auctions-v2.
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardTab } from '@/components/admin/auction-preparation/tabs/dashboard-tab';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="next-link">
      {children}
    </a>
  ),
}));

const baseAuction = {
  id: 'auction-123',
  publicId: 'AUC-123',
  title: 'Leilão Teste',
  lots: [{ id: 'lot-1', initialPrice: 1000 }],
  createdAt: new Date().toISOString(),
};

const bids = [{ lotId: 'lot-1', amount: 1500 }];
const habilitations: any[] = [];
const userWins: any[] = [];

describe('DashboardTab quick actions', () => {
  it('usa a rota auctions-v2 para editar leilão', () => {
    render(
      <DashboardTab
        auction={baseAuction as any}
        bids={bids as any}
        habilitations={habilitations}
        userWins={userWins}
      />
    );

    const editLink = screen.getByText(/editar leilão/i).closest('a');
    expect(editLink?.getAttribute('href')).toBe('/admin/auctions-v2/AUC-123');
  });
});
