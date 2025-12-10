/**
 * Visual Regression (TDD Doc): LotMapDisplay must render consistently across providers.
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import LotMapDisplay from '@/components/auction/lot-map-display';
import type { Lot, PlatformSettings } from '@/types';

vi.mock('react-leaflet', () => {
  const ReactLib = require('react');
  const MockContainer = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="leaflet-container" className="leaflet-mock">
      {children}
    </div>
  );
  const MockPrimitive = ({ label }: { label: string }) => (
    <div className="leaflet-primitive">{label}</div>
  );

  return {
    MapContainer: MockContainer,
    TileLayer: ({ url }: { url: string }) => <MockPrimitive label={`tile:${url}`} />,
    Marker: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="leaflet-marker">{children}</div>
    ),
    Popup: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="leaflet-popup">{children}</div>
    ),
    useMapEvents: () => ({ fitBounds: () => undefined }),
  };
});

vi.mock('@/lib/map-utils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/map-utils')>('@/lib/map-utils');
  return {
    ...actual,
    geocodeLocation: vi.fn(async () => ({ lat: -23.56, lng: -46.63 })),
  };
});

const baseLot = {
  id: 'lot-visual-1',
  auctionId: 'auction-1',
  tenantId: 'tenant-1',
  title: 'Apartamento Jardins',
  publicId: 'L-001',
  slug: 'apartamento-jardins',
  cityName: 'São Paulo',
  stateUf: 'SP',
  price: 350000,
  initialPrice: 350000,
  bidIncrementStep: 5000,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
} as unknown as Lot;

const createPlatformSettingsMock = (partial: Partial<PlatformSettings>): PlatformSettings => (
  {
    id: 'platform-settings-mock',
    tenantId: 'tenant-mock',
    crudFormMode: 'modal',
    themes: null,
    platformPublicIdMasks: null,
    mapSettings: null,
    biddingSettings: null,
    paymentGatewaySettings: null,
    notificationSettings: null,
    mentalTriggerSettings: null,
    sectionBadgeVisibility: null,
    variableIncrementTable: [],
    ...partial,
  } as unknown as PlatformSettings
);

const createMapSettingsMock = (partial: Record<string, unknown>) => (
  {
    id: 'map-settings-mock',
    platformSettingsId: BigInt(1),
    defaultProvider: 'openstreetmap',
    googleMapsApiKey: null,
    ...partial,
  } as unknown as NonNullable<PlatformSettings['mapSettings']>
);

const staticProviderSettings = createPlatformSettingsMock({
  id: 'ps-1',
  tenantId: 'tenant-1',
  mapSettings: createMapSettingsMock({ id: 'map-1', defaultProvider: 'staticImage' }),
});

const openMapSettings = createPlatformSettingsMock({
  id: 'ps-2',
  tenantId: 'tenant-1',
  mapSettings: createMapSettingsMock({ id: 'map-2', defaultProvider: 'openmap' }),
});

describe('LotMapDisplay visual regressions', () => {
  beforeEach(async () => {
    await page.viewport(1024, 768);
  });

  it('renderiza fallback de imagem estática', async () => {
    await render(
      <div data-testid="lot-map-static" className="p-4">
        <LotMapDisplay lot={{ ...baseLot, latitude: null, longitude: null }} platformSettings={staticProviderSettings} />
      </div>,
    );

    await expect(page.getByTestId('lot-map-static')).toBeVisible();
    await expect(page.getByTestId('lot-map-static')).toMatchScreenshot('lot-map-static.png');
  });

  it('renderiza camada leaflet para openmap', async () => {
    await render(
      <div data-testid="lot-map-openmap" className="p-4">
        <LotMapDisplay lot={{ ...baseLot, latitude: -23.55, longitude: -46.64 }} platformSettings={openMapSettings} />
      </div>,
    );

    await expect(page.getByTestId('leaflet-container')).toBeVisible();
    await expect(page.getByTestId('lot-map-openmap')).toMatchScreenshot('lot-map-openmap.png');
  });
});
