import type { Auction, DirectSaleOffer, Lot, PlatformSettings } from '@/types';

const CACHE_PREFIX = 'bidexpert-map-cache';
export const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutos

type DatasetKey = 'lots' | 'auctions' | 'directSales' | 'settings';

interface CacheEnvelope<T> {
  timestamp: number;
  data: T;
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.sessionStorage;
  } catch (error) {
    console.warn('[map-search-cache] Storage unavailable', error);
    return null;
  }
}

function makeKey(key: DatasetKey) {
  return `${CACHE_PREFIX}:${key}`;
}

function readCacheEnvelope<T>(key: DatasetKey): CacheEnvelope<T> | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(makeKey(key));
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      storage.removeItem(makeKey(key));
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('[map-search-cache] Failed to parse cache', error);
    storage.removeItem(makeKey(key));
    return null;
  }
}

function writeCacheEnvelope<T>(key: DatasetKey, data: T) {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  const payload: CacheEnvelope<T> = {
    timestamp: Date.now(),
    data,
  };
  try {
    storage.setItem(
      makeKey(key),
      JSON.stringify(payload, (_jsonKey, value) => {
        if (typeof value === 'bigint') {
          return Number(value);
        }
        return value;
      }),
    );
  } catch (error) {
    console.warn('[map-search-cache] Failed to persist cache', error);
  }
}

export function readMapCacheSnapshot() {
  const lots = readCacheEnvelope<Lot[]>('lots');
  const auctions = readCacheEnvelope<Auction[]>('auctions');
  const directSales = readCacheEnvelope<DirectSaleOffer[]>('directSales');
  const settings = readCacheEnvelope<PlatformSettings>('settings');
  const timestamps = [lots?.timestamp, auctions?.timestamp, directSales?.timestamp, settings?.timestamp]
    .filter((value): value is number => typeof value === 'number');

  return {
    lots: lots?.data ?? null,
    auctions: auctions?.data ?? null,
    directSales: directSales?.data ?? null,
    settings: settings?.data ?? null,
    lastUpdatedAt: timestamps.length ? Math.max(...timestamps) : null,
  };
}

export function persistMapCacheSnapshot(payload: {
  lots?: Lot[];
  auctions?: Auction[];
  directSales?: DirectSaleOffer[];
  settings?: PlatformSettings | null;
}) {
  if (payload.lots) {
    writeCacheEnvelope('lots', payload.lots);
  }
  if (payload.auctions) {
    writeCacheEnvelope('auctions', payload.auctions);
  }
  if (payload.directSales) {
    writeCacheEnvelope('directSales', payload.directSales);
  }
  if (payload.settings) {
    writeCacheEnvelope('settings', payload.settings);
  }
}

export function describeRelativeTimestamp(timestamp: number | null) {
  if (!timestamp) {
    return null;
  }
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes <= 0) {
    return 'Atualizado agora';
  }
  if (minutes < 60) {
    return minutes === 1 ? 'Atualizado há 1 min' : `Atualizado há ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? 'Atualizado há 1 hora' : `Atualizado há ${hours} horas`;
  }
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Atualizado há 1 dia' : `Atualizado há ${days} dias`;
}
