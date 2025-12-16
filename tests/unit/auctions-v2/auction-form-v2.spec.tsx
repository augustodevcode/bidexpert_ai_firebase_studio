/**
 * @fileoverview BDD/TDD: garante mapa com coordenadas e vínculo à biblioteca de mídia no AuctionFormV2.
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import AuctionFormV2 from '@/app/admin/auctions-v2/components/auction-form-v2';
import type {
  Auction,
  AuctionStage,
  AuctioneerProfileInfo,
  SellerProfileInfo,
  StateInfo,
  CityInfo,
  JudicialProcess,
} from '@/types';

const mapPropsLog: Array<{ center: [number, number]; zoom: number }> = [];

vi.mock('react-leaflet', () => {
  const ReactLib = require('react');
  const MockContainer = ({ children, center, zoom, whenCreated }: any) => {
    ReactLib.useEffect(() => {
      whenCreated?.({
        flyTo: vi.fn(),
        invalidateSize: vi.fn(),
      });
    }, [whenCreated]);
    mapPropsLog.push({ center, zoom });
    return (
      <div data-testid="mock-map" data-center={JSON.stringify(center)} data-zoom={zoom}>
        {children}
      </div>
    );
  };
  const Marker = ({ position }: any) => <div data-testid="mock-marker" data-position={JSON.stringify(position)} />;
  const TileLayer = () => <div data-testid="mock-tile" />;
  return { MapContainer: MockContainer, Marker, TileLayer };
});

vi.mock('@/components/admin/media/choose-media-dialog', () => ({
  __esModule: true,
  default: ({ onMediaSelect }: { onMediaSelect: (items: any[]) => void }) => (
    <button
      type="button"
      data-testid="fake-media-dialog"
      onClick={() => onMediaSelect([{ id: 'mid-99', urlOriginal: 'https://img.test/cover.png' }])}
    >
      dialog-midia
    </button>
  ),
}));

const baseStage = {
  id: 'stage-1',
  auctionId: 'auction-1',
  tenantId: 'tenant-1',
  name: 'Praça 1',
  startDate: new Date('2024-01-01T10:00:00Z').toISOString(),
  endDate: new Date('2024-01-01T12:00:00Z').toISOString(),
  discountPercent: 100,
  createdAt: new Date('2024-01-01T09:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-01T09:30:00Z').toISOString(),
} as unknown as AuctionStage;

const baseAuction = {
  id: 'auction-1',
  publicId: 'AUC-1',
  tenantId: 'tenant-1',
  title: 'Leilão Central',
  status: 'RASCUNHO',
  auctionType: 'JUDICIAL',
  auctionMethod: 'STANDARD',
  participation: 'ONLINE',
  auctionStages: [baseStage],
  createdAt: new Date('2024-01-01T09:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-01T09:30:00Z').toISOString(),
} as unknown as Auction;

const deps = {
  auctioneers: [] as AuctioneerProfileInfo[],
  sellers: [] as SellerProfileInfo[],
  states: [] as StateInfo[],
  allCities: [] as CityInfo[],
  judicialProcesses: [] as JudicialProcess[],
};

const onSubmit = vi.fn().mockResolvedValue({ success: true, message: 'ok' });

describe('AuctionFormV2 mapa e mídia', () => {
  beforeEach(() => {
    mapPropsLog.length = 0;
    onSubmit.mockClear();
  });

  it('renderiza marcador quando coordenadas existem e aplica zoom aproximado', () => {
    render(
      <AuctionFormV2
        initialData={{ ...baseAuction, latitude: '-23.55' as any, longitude: '-46.63' as any }}
        {...deps}
        isEditing
        onSubmit={onSubmit}
      />
    );

    const marker = screen.getByTestId('mock-marker');
    expect(marker.getAttribute('data-position')).toContain('-23.55');
    expect(mapPropsLog[0]?.center).toEqual([-23.55, -46.63]);
    expect(mapPropsLog[0]?.zoom).toBe(16);
  });

  it('vincula imagem pela biblioteca e preenche o campo de mídia', () => {
    render(
      <AuctionFormV2
        initialData={baseAuction}
        {...deps}
        isEditing
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByTestId('auction-media-library-button'));
    fireEvent.click(screen.getByTestId('fake-media-dialog'));

    const mediaInput = screen.getByTestId('auction-media-id-input') as HTMLInputElement;
    expect(mediaInput.value).toBe('mid-99');
    expect(screen.getByTestId('auction-image-preview')).toBeInTheDocument();
  });
});
