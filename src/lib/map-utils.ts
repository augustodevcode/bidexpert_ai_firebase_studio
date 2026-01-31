/**
 * @fileoverview Helper utilities for resolving map providers, tile layers,
 * and geocoding fallbacks shared across BidExpert map experiences.
 */
import type { PlatformSettings } from '@/types';

export type MapProvider = 'openstreetmap' | 'openmap' | 'google' | 'staticImage';

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface LocationDescriptor {
  latitude?: number | null;
  longitude?: number | null;
  mapAddress?: string | null;
  address?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  cityName?: string | null;
  locationCity?: string | null;
  state?: string | null;
  stateUf?: string | null;
  locationState?: string | null;
  zipCode?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

const TILE_LAYER_CONFIG: Record<'openstreetmap' | 'openmap', { url: string; attribution: string; subdomains?: string[]; }>
  = {
    openstreetmap: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    openmap: {
      url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> & <a href="https://www.hotosm.org/">HOT</a>',
      subdomains: ['a', 'b', 'c'],
    },
  };

const DEFAULT_CENTER: LatLngLiteral = { lat: -14.235004, lng: -51.92528 };
const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const geocodeCache = new Map<string, LatLngLiteral>();

type MapSettingsLike = Pick<PlatformSettings, 'mapSettings'> | { mapSettings?: { defaultProvider?: string | null; googleMapsApiKey?: string | null } | null } | null;

export function normalizeMapProvider(settings?: MapSettingsLike): MapProvider {
  const raw = settings?.mapSettings?.defaultProvider?.toLowerCase();
  const apiKey = settings?.mapSettings?.googleMapsApiKey;

  // Google Maps Fallback Logic:
  // If provider is Google but API Key is missing or invalid format (doesn't start with AIza),
  // fallback to OpenMap to ensure the user sees a map instead of an error.
  if (raw === 'google') {
    if (!apiKey || apiKey.trim() === '' || !apiKey.trim().startsWith('AIza')) {
      return 'openmap';
    }
    return 'google';
  }

  switch (raw) {
    case 'staticimage':
      return 'staticImage';
    case 'openmap':
      return 'openmap';
    default:
      return 'openstreetmap';
  }
}

export function getTileLayerConfig(provider: MapProvider) {
  if (provider === 'openstreetmap' || provider === 'openmap') {
    return TILE_LAYER_CONFIG[provider];
  }
  return null;
}

export function getDefaultCenter(): LatLngLiteral {
  return DEFAULT_CENTER;
}

type ExtendedLocationFields = LocationDescriptor & {
  lat?: number | string | null;
  lng?: number | string | null;
  fullAddress?: string | null;
  streetName?: string | null;
  streetNumber?: string | null;
  district?: string | null;
};

export function buildLocationDescriptor(entity: ExtendedLocationFields): LocationDescriptor {
  return {
    latitude: coerceNumber(entity.latitude ?? entity.lat),
    longitude: coerceNumber(entity.longitude ?? entity.lng),
    mapAddress: coerceString(entity.mapAddress ?? entity.address ?? entity.fullAddress ?? null),
    address: coerceString(entity.address ?? null),
    street: coerceString(entity.street ?? entity.streetName ?? null),
    number: coerceString(entity.number ?? entity.streetNumber ?? null),
    complement: coerceString(entity.complement ?? null),
    neighborhood: coerceString(entity.neighborhood ?? entity.district ?? null),
    city: coerceString(entity.city ?? entity.cityName ?? entity.locationCity ?? null),
    state: coerceString(entity.state ?? entity.stateUf ?? entity.locationState ?? null),
    zipCode: coerceString(entity.zipCode ?? entity.postalCode ?? null),
    country: coerceString(entity.country ?? 'Brasil'),
  };
}

function coerceNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && !Number.isNaN(parsed) ? parsed : null;
}

function coerceString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return String(value).trim() || null;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

type BoundsLike = {
  getNorthEast: () => { lat: number; lng: number };
  getSouthWest: () => { lat: number; lng: number };
};

export function boundingBoxFromLatLngBounds(bounds: BoundsLike): BoundingBox {
  const northEast = bounds.getNorthEast();
  const southWest = bounds.getSouthWest();
  return {
    north: northEast.lat,
    south: southWest.lat,
    east: northEast.lng,
    west: southWest.lng,
  };
}

type CoordinateCarrier = { id: string | number; latitude?: number | null; longitude?: number | null };

export function filterIdsWithinBounds<T extends CoordinateCarrier>(items: T[], box: BoundingBox): string[] {
  return items
    .filter(item => {
      if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number') {
        return false;
      }
      const lat = item.latitude;
      const lng = item.longitude;
      const withinLat = lat >= box.south && lat <= box.north;
      const withinLng = lng >= box.west && lng <= box.east;
      return withinLat && withinLng;
    })
    .map(item => item.id.toString());
}

export function buildGeocodeQuery(descriptor: LocationDescriptor): string | null {
  const pieces = extractLocationPieces(descriptor);

  if (descriptor.mapAddress) {
    const segments = [descriptor.mapAddress];
    if (pieces.cleanedZip && !includesIgnoreCase(descriptor.mapAddress, pieces.cleanedZip)) {
      segments.push(pieces.cleanedZip);
    }
    const needsCityState = (pieces.city && !includesIgnoreCase(descriptor.mapAddress, pieces.city))
      || (pieces.state && !includesIgnoreCase(descriptor.mapAddress, pieces.state));
    if (pieces.cityState && needsCityState) {
      segments.push(pieces.cityState);
    }
    return appendCountry(segments.filter(Boolean).join(', '), pieces.country);
  }

  if (pieces.cleanedZip) {
    const zipWithRegion = [pieces.cleanedZip, pieces.cityState].filter(Boolean).join(', ') || pieces.cleanedZip;
    return appendCountry(zipWithRegion, pieces.country);
  }

  if (pieces.streetParts && pieces.cityState) {
    return appendCountry(`${pieces.streetParts}, ${pieces.cityState}`, pieces.country);
  }

  if (pieces.cityState) {
    return appendCountry(pieces.cityState, pieces.country);
  }

  if (pieces.state) {
    return appendCountry(pieces.state, pieces.country);
  }

  return null;
}

export function buildGeocodeQueries(descriptor: LocationDescriptor): string[] {
  const queries = new Set<string>();
  const pieces = extractLocationPieces(descriptor);

  const primary = buildGeocodeQuery(descriptor);
  if (primary) {
    queries.add(primary);
  }

  if (pieces.cleanedZip) {
    const zipWithRegion = [pieces.cleanedZip, pieces.cityState].filter(Boolean).join(', ') || pieces.cleanedZip;
    queries.add(appendCountry(zipWithRegion, pieces.country));
  }

  if (pieces.streetParts && pieces.cityState) {
    queries.add(appendCountry(`${pieces.streetParts}, ${pieces.cityState}`, pieces.country));
  }

  if (pieces.cityState) {
    queries.add(appendCountry(pieces.cityState, pieces.country));
  }

  if (pieces.state) {
    queries.add(appendCountry(pieces.state, pieces.country));
  }

  return Array.from(queries);
}

function appendCountry(value: string, country: string) {
  return value.toLowerCase().includes(country.toLowerCase()) ? value : `${value}, ${country}`;
}

function includesIgnoreCase(base: string, fragment?: string | null) {
  if (!fragment) {
    return false;
  }
  return base.toLowerCase().includes(fragment.toLowerCase());
}

export async function geocodeLocation(descriptor: LocationDescriptor): Promise<LatLngLiteral | null> {
  const queries = buildGeocodeQueries(descriptor);
  if (queries.length === 0) {
    return null;
  }

  for (const query of queries) {
    if (geocodeCache.has(query)) {
      const cached = geocodeCache.get(query);
      if (cached) {
        return cached;
      }
      continue;
    }

    const coords = await lookupCoordinates(query);
    if (coords) {
      geocodeCache.set(query, coords);
      return coords;
    }
  }

  return null;
}

export function getGoogleEmbedUrl(opts: {
  coords?: LatLngLiteral | null;
  apiKey?: string | null;
  zoom?: number;
  query?: string | null;
}): string | null {
  if (!opts.apiKey) {
    return null;
  }

  if (opts.coords) {
    const { lat, lng } = opts.coords;
    return `https://www.google.com/maps/embed/v1/view?key=${opts.apiKey}&center=${lat},${lng}&zoom=${opts.zoom ?? 15}&maptype=roadmap`;
  }

  if (opts.query) {
    return `https://www.google.com/maps/embed/v1/search?key=${opts.apiKey}&q=${encodeURIComponent(opts.query)}`;
  }

  return null;
}

export function getStaticMapImageUrl(opts: {
  coords?: LatLngLiteral | null;
  apiKey?: string | null;
  zoom?: number;
}): string | null {
  const { coords, apiKey } = opts;
  if (!coords) {
    return null;
  }

  // Only use Google Static Maps if we have a seemingly valid key
  if (apiKey && apiKey.trim().startsWith('AIza')) {
    const { lat, lng } = coords;
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${opts.zoom ?? 15}&size=640x400&scale=2&markers=color:red|${lat},${lng}&key=${apiKey}`;
  }

  // Open static map alternative without API key
  const { lat, lng } = coords;
  return `https://static-maps.yandex.ru/1.x/?lang=pt-BR&ll=${lng},${lat}&z=${opts.zoom ?? 15}&l=map&size=650,450&pt=${lng},${lat},pm2rdm`;
}

function extractLocationPieces(descriptor: LocationDescriptor) {
  const city = descriptor.city ?? descriptor.cityName ?? descriptor.locationCity ?? null;
  const state = descriptor.state ?? descriptor.stateUf ?? descriptor.locationState ?? null;
  const country = descriptor.country ?? 'Brasil';
  const cleanedZip = descriptor.zipCode ? descriptor.zipCode.replace(/\s+/g, '') : null;
  const cityStateRaw = [city, state].filter(Boolean).join(', ').trim();
  const cityState = cityStateRaw || null;
  const streetPartsRaw = [descriptor.street, descriptor.number, descriptor.neighborhood]
    .filter(Boolean)
    .join(' ')
    .trim();
  const streetParts = streetPartsRaw || null;

  return { city, state, country, cleanedZip, cityState, streetParts };
}

async function lookupCoordinates(query: string): Promise<LatLngLiteral | null> {
  const url = `${NOMINATIM_ENDPOINT}?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BidExpertMapResolver/1.0 (https://bidexpert.ai)',
        'Accept-Language': 'pt-BR',
      },
    });

    if (!response.ok) {
      console.warn('[map-utils] Geocode request failed', response.status, response.statusText, 'for query', query);
      return null;
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const first = data[0];
    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }

    return { lat, lng };
  } catch (error) {
    console.error('[map-utils] Geocode lookup error', { query, error });
    return null;
  }
}
