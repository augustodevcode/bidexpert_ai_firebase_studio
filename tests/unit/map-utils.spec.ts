/**
 * TDD: Unit tests for map helper utilities (provider normalization, geocode cache).
 */
import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import {
  normalizeMapProvider,
  buildGeocodeQuery,
  geocodeLocation,
  type MapProvider,
} from '@/lib/map-utils';

describe('map-utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('normalizes map providers consistently', () => {
    const provider = normalizeMapProvider({ mapSettings: { defaultProvider: 'openmap' } as any });
    expect(provider).toBe<MapProvider>('openmap');
    expect(normalizeMapProvider({ mapSettings: { defaultProvider: 'staticImage' } as any })).toBe('staticImage');
    expect(normalizeMapProvider(undefined)).toBe('openstreetmap');
  });

  it('builds geocode query with fallback to city/state', () => {
    const query = buildGeocodeQuery({ city: 'São Paulo', state: 'SP', country: 'Brasil' });
    expect(query).toBe('São Paulo, SP, Brasil');
    const streetQuery = buildGeocodeQuery({ street: 'Av. Paulista', number: '1000', city: 'São Paulo', country: 'Brasil' });
    expect(streetQuery).toContain('Av. Paulista 1000');
  });

  it('enriches vague mapAddress with zip and city/state context', () => {
    const query = buildGeocodeQuery({
      mapAddress: 'Endereço Central',
      city: 'Natal',
      state: 'RN',
      zipCode: '59000-000',
      country: 'Brasil',
    });
    expect(query).toContain('Endereço Central');
    expect(query).toContain('Natal');
    expect(query).toContain('RN');
    expect(query).toContain('59000-000');
  });

  describe('geocodeLocation caching behavior', () => {
    const mockResponse = { ok: true, json: async () => [{ lat: '10.0', lon: '-45.0' }] } as Response;

    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));
    });

    it('reuses cached coordinates for identical queries', async () => {
      const descriptor = { city: 'Campinas', state: 'SP', country: 'Brasil' };
      const first = await geocodeLocation(descriptor);
      const second = await geocodeLocation(descriptor);
      expect(first).toEqual({ lat: 10, lng: -45 });
      expect(second).toEqual(first);
      expect((fetch as unknown as Mock).mock.calls.length).toBe(1);
    });

    it('returns null when no query can be generated', async () => {
      const result = await geocodeLocation({});
      expect(result).toBeNull();
      expect((fetch as unknown as Mock).mock.calls.length).toBe(0);
    });
  });

  it('falls back to broader queries when specific lookup fails', async () => {
    const emptyResponse = { ok: true, json: async () => [] } as Response;
    const resolvedResponse = { ok: true, json: async () => [{ lat: '-5.81', lon: '-35.21' }] } as Response;
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(emptyResponse)
      .mockResolvedValueOnce(resolvedResponse));

    const descriptor = {
      mapAddress: 'Endereço Central',
      city: 'Natal',
      state: 'RN',
      country: 'Brasil',
    };

    const coords = await geocodeLocation(descriptor);
    expect(coords).toEqual({ lat: -5.81, lng: -35.21 });
    expect((fetch as unknown as Mock).mock.calls.length).toBe(2);
    const firstCall = (fetch as unknown as Mock).mock.calls[0][0] as string;
    const secondCall = (fetch as unknown as Mock).mock.calls[1][0] as string;
    expect(firstCall).toContain('Endere%C3%A7o%20Central');
    expect(secondCall).toContain('Natal');
  });
});
