import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuctioneerDetailsPage from '@/app/auctioneers/[auctioneerSlug]/page';
import type { Auction, AuctioneerProfileInfo, PlatformSettings } from '@/types';

// Mock dos componentes
vi.mock('@/components/BidExpertCard', () => ({
  __esModule: true,
  default: ({ item, type }: { item: Auction; type: string }) => (
    <div data-testid={`bidexpert-card-${type}-${item.id}`}>
      {item.title}
    </div>
  ),
}));

vi.mock('@/components/BidExpertListItem', () => ({
  __esModule: true,
  default: ({ item, type }: { item: Auction; type: string }) => (
    <div data-testid={`bidexpert-list-item-${type}-${item.id}`}>
      {item.title}
    </div>
  ),
}));

vi.mock('@/components/search-results-frame', () => ({
  __esModule: true,
  default: ({ items, renderGridItem, renderListItem }: any) => (
    <div data-testid="search-results-frame">
      <div data-testid="grid-view">
        {items.map((item: Auction) => renderGridItem(item))}
      </div>
      <div data-testid="list-view">
        {items.map((item: Auction) => renderListItem(item))}
      </div>
    </div>
  ),
}));

// Mock do useParams
vi.mock('next/navigation', () => ({
  useParams: () => ({
    auctioneerSlug: 'test-auctioneer',
  }),
}));

// Mock do useAuth
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    userProfileWithPermissions: null,
  }),
}));

// Mock do hasAnyPermission
vi.mock('@/lib/permissions', () => ({
  hasAnyPermission: () => false,
}));

// Mock dos actions
vi.mock('@/app/admin/auctioneers/actions', () => ({
  getAuctioneerBySlug: vi.fn(),
}));

vi.mock('@/app/admin/auctions/actions', () => ({
  getAuctionsByAuctioneerSlug: vi.fn(),
}));

vi.mock('@/app/admin/settings/actions', () => ({
  getPlatformSettings: vi.fn(),
}));

// Mock do useEmblaCarousel
vi.mock('embla-carousel-react', () => ({
  __esModule: true,
  default: () => [null, null],
}));

vi.mock('embla-carousel-autoplay', () => ({
  __esModule: true,
  default: () => null,
}));

// Mock do isValidImageUrl
vi.mock('@/lib/ui-helpers', () => ({
  isValidImageUrl: () => true,
}));

const mockAuction: Auction = {
  id: 'auction-1',
  publicId: 'AUC-001',
  title: 'Leilão Teste',
  auctionType: 'JUDICIAL',
  status: 'ABERTO_PARA_LANCES',
  auctionDate: new Date().toISOString(),
  totalLots: 5,
  totalHabilitatedUsers: 10,
  visits: 100,
  initialOffer: 50000,
  seller: {
    name: 'Comitente Teste',
    logoUrl: null,
  },
} as Auction;

const mockAuctioneer: AuctioneerProfileInfo = {
  id: 'auctioneer-1',
  name: 'Leiloeiro Teste',
  slug: 'test-auctioneer',
  registrationNumber: '12345',
  logoUrl: 'https://example.com/logo.png',
  auctionsConductedCount: 10,
  totalValueSold: 1000000,
} as AuctioneerProfileInfo;

const mockPlatformSettings: PlatformSettings = {
  id: 'settings-1',
  searchItemsPerPage: 6,
} as PlatformSettings;

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('AuctioneerDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar BidExpertCard para visualização em grid', async () => {
    // Mock das funções de busca
    const { getAuctioneerBySlug, getAuctionsByAuctioneerSlug, getPlatformSettings } = await import('@/app/admin/auctioneers/actions');
    const auctionsAction = await import('@/app/admin/auctions/actions');
    const settingsAction = await import('@/app/admin/settings/actions');

    vi.mocked(getAuctioneerBySlug).mockResolvedValue(mockAuctioneer);
    vi.mocked(auctionsAction.getAuctionsByAuctioneerSlug).mockResolvedValue([mockAuction]);
    vi.mocked(settingsAction.getPlatformSettings).mockResolvedValue(mockPlatformSettings);

    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuctioneerDetailsPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('bidexpert-card-auction-auction-1')).toBeInTheDocument();
    });
  });

  it('deve renderizar BidExpertListItem para visualização em lista', async () => {
    // Mock das funções de busca
    const { getAuctioneerBySlug } = await import('@/app/admin/auctioneers/actions');
    const auctionsAction = await import('@/app/admin/auctions/actions');
    const settingsAction = await import('@/app/admin/settings/actions');

    vi.mocked(getAuctioneerBySlug).mockResolvedValue(mockAuctioneer);
    vi.mocked(auctionsAction.getAuctionsByAuctioneerSlug).mockResolvedValue([mockAuction]);
    vi.mocked(settingsAction.getPlatformSettings).mockResolvedValue(mockPlatformSettings);

    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuctioneerDetailsPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('bidexpert-list-item-auction-auction-1')).toBeInTheDocument();
    });
  });

  it('deve exibir informações do leiloeiro', async () => {
    const { getAuctioneerBySlug } = await import('@/app/admin/auctioneers/actions');
    const auctionsAction = await import('@/app/admin/auctions/actions');
    const settingsAction = await import('@/app/admin/settings/actions');

    vi.mocked(getAuctioneerBySlug).mockResolvedValue(mockAuctioneer);
    vi.mocked(auctionsAction.getAuctionsByAuctioneerSlug).mockResolvedValue([]);
    vi.mocked(settingsAction.getPlatformSettings).mockResolvedValue(mockPlatformSettings);

    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuctioneerDetailsPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Leiloeiro Teste')).toBeInTheDocument();
    });
  });
});