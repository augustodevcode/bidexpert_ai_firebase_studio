// src/app/home-v2/__tests__/page.test.tsx
/**
 * @file Testes unitários para a página Home V2
 * @description Testa a exibição de estatísticas reais da plataforma
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock do prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { count: vi.fn() },
    auction: { count: vi.fn() },
    lot: { count: vi.fn() },
    seller: { count: vi.fn() },
  },
}));

// Mock das funções de dados dos segmentos
vi.mock('@/components/home-v2/segment-data', () => ({
  getSegmentEvents: vi.fn().mockResolvedValue([]),
  getSegmentLots: vi.fn().mockResolvedValue([]),
  getSegmentStats: vi.fn().mockResolvedValue({ eventsCount: 0, lotsCount: 0 }),
}));

// Mock das configurações da plataforma
vi.mock('@/app/admin/settings/actions', () => ({
  getPlatformSettings: vi.fn().mockResolvedValue(null),
}));

// Importa após os mocks
import { prisma } from '@/lib/prisma';
import HomePage from '../page';

describe('Home V2 Page - Platform Stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve exibir estatísticas reais da plataforma', async () => {
    // Mock dos dados retornados pelo Prisma
    vi.mocked(prisma.user.count).mockResolvedValue(1250);
    vi.mocked(prisma.auction.count).mockResolvedValue(89);
    vi.mocked(prisma.lot.count).mockResolvedValue(2340);
    vi.mocked(prisma.seller.count).mockResolvedValue(45);

    // Renderiza o componente
    const Page = await HomePage();
    render(Page);

    // Verifica se as estatísticas são exibidas
    expect(screen.getByText('2,340+')).toBeInTheDocument();
    expect(screen.getByText('Lotes ativos')).toBeInTheDocument();

    expect(screen.getByText('89+')).toBeInTheDocument();
    expect(screen.getByText('Eventos realizados')).toBeInTheDocument();

    expect(screen.getByText('1,250+')).toBeInTheDocument();
    expect(screen.getByText('Usuários cadastrados')).toBeInTheDocument();
  });

  it('deve exibir zeros quando não há dados', async () => {
    // Mock dos dados vazios
    vi.mocked(prisma.user.count).mockResolvedValue(0);
    vi.mocked(prisma.auction.count).mockResolvedValue(0);
    vi.mocked(prisma.lot.count).mockResolvedValue(0);
    vi.mocked(prisma.seller.count).mockResolvedValue(0);

    // Renderiza o componente
    const Page = await HomePage();
    render(Page);

    // Verifica se zeros são exibidos
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Lotes ativos')).toBeInTheDocument();
    expect(screen.getByText('Eventos realizados')).toBeInTheDocument();
    expect(screen.getByText('Usuários cadastrados')).toBeInTheDocument();
  });

  it('deve formatar números grandes corretamente', async () => {
    // Mock dos dados com números grandes
    vi.mocked(prisma.user.count).mockResolvedValue(50000);
    vi.mocked(prisma.auction.count).mockResolvedValue(1500);
    vi.mocked(prisma.lot.count).mockResolvedValue(25000);
    vi.mocked(prisma.seller.count).mockResolvedValue(300);

    // Renderiza o componente
    const Page = await HomePage();
    render(Page);

    // Verifica se os números são formatados com separadores
    expect(screen.getByText('25,000+')).toBeInTheDocument();
    expect(screen.getByText('1,500+')).toBeInTheDocument();
    expect(screen.getByText('50,000+')).toBeInTheDocument();
  });
});