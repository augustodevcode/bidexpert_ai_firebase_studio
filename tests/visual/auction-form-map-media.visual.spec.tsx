/**
 * @fileoverview Regressão visual (BDD/TDD): mapa e vínculo de mídia no AuctionFormV2.
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import AuctionFormV2 from '@/app/admin/auctions-v2/components/auction-form-v2';
import type { Auction, AuctionStage, AuctioneerProfileInfo, SellerProfileInfo, StateInfo, CityInfo, JudicialProcess } from '@/types';

vi.mock('react-leaflet', () => {
  const ReactLib = require('react');
  const MockContainer = ({ children }: any) => <div data-testid="mock-map" className="rounded-md border bg-muted">{children}</div>;
  const Marker = ({ position }: any) => <div data-testid="mock-marker" data-position={JSON.stringify(position)} />;
  const TileLayer = () => <div data-testid="mock-tile" />;
  return { MapContainer: MockContainer, Marker, TileLayer };
});

vi.mock('@/components/admin/media/choose-media-dialog', () => ({
  __esModule: true,
  default: () => <div data-testid="visual-media-dialog">biblioteca de mídia mock</div>,
}));

const stage = {
  id: 'stage-visual',
  auctionId: 'auction-visual',
  tenantId: 'tenant-visual',
  name: 'Praça 1',
  startDate: new Date('2024-02-01T10:00:00Z').toISOString(),
  endDate: new Date('2024-02-01T12:00:00Z').toISOString(),
  discountPercent: 100,
  createdAt: new Date('2024-02-01T09:00:00Z').toISOString(),
  updatedAt: new Date('2024-02-01T09:10:00Z').toISOString(),
} as unknown as AuctionStage;

const auction = {
  id: 'auction-visual',
  publicId: 'AUC-VIS',
  tenantId: 'tenant-visual',
  title: 'Leilão Jardim Paulista',
  status: 'RASCUNHO',
  auctionType: 'JUDICIAL',
  auctionMethod: 'STANDARD',
  participation: 'ONLINE',
  auctionStages: [stage],
  latitude: -23.555,
  longitude: -46.662,
  imageUrl: 'https://img.test/cover.png',
  createdAt: new Date('2024-02-01T09:00:00Z').toISOString(),
  updatedAt: new Date('2024-02-01T09:10:00Z').toISOString(),
} as unknown as Auction;

const deps = {
  auctioneers: [] as AuctioneerProfileInfo[],
  sellers: [] as SellerProfileInfo[],
  states: [] as StateInfo[],
  allCities: [] as CityInfo[],
  judicialProcesses: [] as JudicialProcess[],
};

describe('AuctionFormV2 visual: mapa e mídia', () => {
  beforeEach(async () => {
    await page.viewport(1280, 900);
  });

  it('mantém layout do bloco de localização e mídia', async () => {
    await render(
      <div data-testid="auction-form-visual" className="p-6 bg-background">
        <AuctionFormV2 initialData={auction} {...deps} isEditing onSubmit={vi.fn().mockResolvedValue({ success: true })} />
      </div>
    );

    await new Promise((resolve) => setTimeout(resolve, 80));
    await expect(page.getByTestId('auction-form-visual')).toBeVisible();
    await expect(page.getByTestId('auction-form-visual')).toMatchScreenshot('auction-form-visual-map-media.png');
  });
});
