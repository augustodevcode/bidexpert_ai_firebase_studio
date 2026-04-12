// @vitest-environment jsdom

/**
 * @fileoverview Garante que o renderer V2 dos cards de lote preserve slots
 * estruturais fixos para título, metadados opcionais e rodapé de ações.
 */

import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuctionLotCardV2 from '@/components/cards/auction-lot-card-v2';
import type { AuctionItem } from '@/components/cards/auction-lot-card-v2.types';

vi.mock('@/hooks/use-toast', () => ({
  __esModule: true,
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/lib/favorite-store', () => ({
  __esModule: true,
  isLotFavoriteInStorage: () => false,
  addFavoriteLot: vi.fn().mockResolvedValue(undefined),
  removeFavoriteLot: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/contexts/auth-context', () => ({
  __esModule: true,
  useAuth: () => ({ userProfileWithPermissions: null }),
}));

vi.mock('@/lib/permissions', () => ({
  __esModule: true,
  hasPermission: () => false,
}));

vi.mock('@/components/lot-preview-modal-v2', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'lot-preview-modal' }),
}));

vi.mock('@/components/auction/go-to-live-auction-button', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'go-live-button' }),
}));

vi.mock('@/components/entity-edit-menu', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'entity-edit-menu' }),
}));

const baseItem: AuctionItem = {
  id: 'lot-layout-001',
  category: 'Judicial',
  type: 'Imóvel',
  location: 'São Paulo/SP',
  title: 'Apartamento com varanda gourmet em condomínio com lazer completo e vaga coberta',
  specs: ['123 m²', '3 quartos', '2 vagas'],
  stats: {
    visits: 18,
    qualified: 5,
    clicks: 2,
  },
  pricing: {
    minimumBid: 250000,
    evaluation: 420000,
    increment: 5000,
  },
  timeline: {
    stage1: {
      name: '1ª Praça',
      status: 'Em Andamento',
      date: 'Hoje às 14:00',
    },
    stage2: {
      name: '2ª Praça',
      status: 'Aguardando',
      date: 'Amanhã às 14:00',
    },
    timeRemaining: '01:12:00',
    endDate: new Date(Date.now() + 3_600_000).toISOString(),
  },
  images: ['https://example.com/lot-layout.jpg'],
  isLive: false,
  isOpen: true,
};

describe('AuctionLotCardV2 layout', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ serverTime: new Date().toISOString() }),
      }),
    );

    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('preserva os slots fixos do cabeçalho e ancora o bloco de ações', async () => {
    render(React.createElement(AuctionLotCardV2, { item: baseItem }));

    const card = await screen.findByTestId('auction-lot-card-v2-root');
    const titleShell = screen.getByTestId('auction-lot-card-v2-title-shell');
    const processSlot = screen.getByTestId('auction-lot-card-v2-process-slot');
    const actions = screen.getByTestId('auction-lot-card-v2-actions');

    expect(card.className).toContain('h-full');
    expect(titleShell.className).toContain('min-h-[3.5rem]');
    expect(processSlot.className).toContain('min-h-[1.25rem]');
    expect(actions.className).toContain('mt-auto');
  });

  it('mantém o slot do processo mesmo quando o número não existe', async () => {
    render(React.createElement(AuctionLotCardV2, { item: { ...baseItem, processNumber: undefined } }));

    const processSlot = await screen.findByTestId('auction-lot-card-v2-process-slot');
    expect(processSlot).toBeInTheDocument();
    expect(screen.queryByTestId('auction-lot-card-v2-process-link')).not.toBeInTheDocument();
  });
});