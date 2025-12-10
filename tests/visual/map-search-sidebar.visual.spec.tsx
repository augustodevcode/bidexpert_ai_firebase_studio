import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import MapSearchSidebar from '@/components/map-search-sidebar';
import type { PlatformSettings, Lot, DirectSaleOffer } from '@/types';

vi.mock('@/components/BidExpertListItem', () => ({
  __esModule: true,
  default: ({ item, type }: { item: { title: string }; type: string }) => (
    <div className="rounded-xl border border-border bg-surface/80 p-3" data-testid="mock-list-item">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{type}</p>
      <p className="font-medium text-foreground">{item.title}</p>
    </div>
  ),
}));

const platformSettingsMock = {
  id: 'platform-settings-mock',
  tenantId: 'tenant-1',
  mapSettings: null,
} as unknown as PlatformSettings;

const lotItem = {
  id: 'lot-visual',
  title: 'Lote Visual',
  auctionId: 'auction-visual',
  auction: { id: 'auction-visual', title: 'Leilão Visual' },
} as unknown as Lot;

const offerItem = {
  id: 'offer-visual',
  title: 'Oferta Direta',
  sellerName: 'Comitente Demo',
  status: 'ACTIVE',
} as unknown as DirectSaleOffer;

describe('MapSearchSidebar visual snapshots', () => {
  beforeEach(async () => {
    await page.viewport(1024, 768);
  });

  it('renderiza estado padrão para lotes', async () => {
    await render(
      <div data-testid="map-sidebar-default" className="p-6 bg-background">
        <MapSearchSidebar
          searchTerm=""
          onSearchTermChange={() => undefined}
          onSubmitSearch={(event) => event.preventDefault()}
          dataset="lots"
          onDatasetChange={() => undefined}
          isLoading={false}
          error={null}
          platformSettings={platformSettingsMock}
          displayedItems={[lotItem]}
          resultsLabel="1 resultado"
          visibleItemIds={null}
          activeBounds={null}
          onResetFilters={() => undefined}
          listItemType="lot"
          lastUpdatedLabel="Atualizado agora"
          isRefreshingDatasets={false}
          onForceRefresh={() => undefined}
          isUsingCache={false}
        />
      </div>,
    );

    await expect(page.getByTestId('map-sidebar-default')).toMatchScreenshot('map-search-sidebar-lots.png');
  });

  it('renderiza estado filtrado para venda direta', async () => {
    await render(
      <div data-testid="map-sidebar-direct" className="p-6 bg-background">
        <MapSearchSidebar
          searchTerm="venda"
          onSearchTermChange={() => undefined}
          onSubmitSearch={(event) => event.preventDefault()}
          dataset="direct_sale"
          onDatasetChange={() => undefined}
          isLoading={false}
          error={null}
          platformSettings={platformSettingsMock}
          displayedItems={[offerItem]}
          resultsLabel="1 resultado"
          visibleItemIds={['offer-visual']}
          activeBounds={{} as any}
          onResetFilters={() => undefined}
          listItemType="direct_sale"
          lastUpdatedLabel="Atualizado há 5 min"
          isRefreshingDatasets={false}
          onForceRefresh={() => undefined}
          isUsingCache={true}
          listDensity="compact"
        />
      </div>,
    );

    await expect(page.getByTestId('map-sidebar-direct')).toMatchScreenshot('map-search-sidebar-direct.png');
  });
});
