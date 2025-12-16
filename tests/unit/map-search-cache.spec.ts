import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { CACHE_TTL_MS, describeRelativeTimestamp, persistMapCacheSnapshot, readMapCacheSnapshot } from '@/app/map-search/map-search-cache';

const lotStub = { id: 'lot-cache', auctionId: 'auction-cache' } as any;
const auctionStub = { id: 'auction-cache', auctionType: 'EXTRAJUDICIAL' } as any;
const directSaleStub = { id: 'direct-sale-cache', offerType: 'BUY_NOW' } as any;

const createSessionStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    clear: () => {
      store = {};
    },
    getItem: (key: string) => store[key] ?? null,
    key: (index: number) => Object.keys(store)[index] ?? null,
    removeItem: (key: string) => {
      delete store[key];
    },
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
  } satisfies Storage;
};

describe('map-search-cache helpers', () => {
  beforeEach(() => {
    const mockStorage = createSessionStorageMock();
    vi.stubGlobal('sessionStorage', mockStorage);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('persists snapshots for lots, auctions e direct sales', () => {
    persistMapCacheSnapshot({ lots: [lotStub], auctions: [auctionStub], directSales: [directSaleStub], settings: null });
    const snapshot = readMapCacheSnapshot();
    expect(snapshot.lots).toHaveLength(1);
    expect(snapshot.auctions).toHaveLength(1);
    expect(snapshot.directSales).toHaveLength(1);
    expect(snapshot.lastUpdatedAt).not.toBeNull();
  });

  it('expira caches após o TTL configurado', () => {
    vi.useFakeTimers();
    persistMapCacheSnapshot({ lots: [lotStub] });
    vi.advanceTimersByTime(CACHE_TTL_MS + 1000);
    const snapshot = readMapCacheSnapshot();
    expect(snapshot.lots).toBeNull();
  });

  it('formata o texto relativo de atualização', () => {
    vi.useFakeTimers();
    const now = new Date('2025-01-01T00:00:00Z');
    vi.setSystemTime(now);
    expect(describeRelativeTimestamp(now.getTime())).toBe('Atualizado agora');
    vi.advanceTimersByTime(6 * 60 * 1000);
    expect(describeRelativeTimestamp(now.getTime())).toBe('Atualizado há 6 min');
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(describeRelativeTimestamp(now.getTime())).toBe('Atualizado há 1 hora');
  });
});
