import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getRecentlyViewedIds, addRecentlyViewedId, removeRecentlyViewedId } from '@/lib/recently-viewed-store';

const RECENTLY_VIEWED_KEY = 'recentlyViewedLots';

function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
}

describe('recently-viewed-store', () => {
  const localStorageMock = createLocalStorageMock();
  const dispatchEvent = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('window', {
      dispatchEvent,
      location: { href: 'http://localhost' }
    });

    // For CustomEvent
    vi.stubGlobal('CustomEvent', class {
      constructor(public type: string) {}
    });

    localStorageMock.clear();
    dispatchEvent.mockClear();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('getRecentlyViewedIds', () => {
    it('returns empty array when nothing is stored', () => {
      expect(getRecentlyViewedIds()).toEqual([]);
    });

    it('returns valid IDs from storage', () => {
      const items = [
        { id: '123', timestamp: Date.now() },
        { id: '456', timestamp: Date.now() }
      ];
      localStorageMock.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items));

      expect(getRecentlyViewedIds()).toEqual(['123', '456']);
    });

    it('filters out expired items', () => {
      const now = Date.now();
      const threeDaysAgoPlusOneMin = now - (3 * 24 * 60 * 60 * 1000) - 60000;
      const items = [
        { id: '123', timestamp: now },
        { id: '456', timestamp: threeDaysAgoPlusOneMin }
      ];
      localStorageMock.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items));

      expect(getRecentlyViewedIds()).toEqual(['123']);
    });

    it('filters out non-numeric IDs', () => {
      const items = [
        { id: '123', timestamp: Date.now() },
        { id: 'abc', timestamp: Date.now() }
      ];
      localStorageMock.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items));

      expect(getRecentlyViewedIds()).toEqual(['123']);
    });

    it('handles invalid JSON by returning empty array', () => {
      localStorageMock.setItem(RECENTLY_VIEWED_KEY, 'invalid-json');
      expect(getRecentlyViewedIds()).toEqual([]);
    });
  });

  describe('addRecentlyViewedId', () => {
    it('adds a new ID to the top', () => {
      addRecentlyViewedId('123');
      expect(getRecentlyViewedIds()).toEqual(['123']);

      addRecentlyViewedId('456');
      expect(getRecentlyViewedIds()).toEqual(['456', '123']);
    });

    it('moves existing ID to the top', () => {
      addRecentlyViewedId('123');
      addRecentlyViewedId('456');
      addRecentlyViewedId('123');

      expect(getRecentlyViewedIds()).toEqual(['123', '456']);
    });

    it('respects maximum limit', () => {
      for (let i = 1; i <= 15; i++) {
        addRecentlyViewedId(i.toString());
      }

      const ids = getRecentlyViewedIds();
      expect(ids.length).toBe(10);
      expect(ids[0]).toBe('15');
      expect(ids[9]).toBe('6');
    });

    it('handles invalid JSON in storage by resetting and adding new ID', () => {
      localStorageMock.setItem(RECENTLY_VIEWED_KEY, 'invalid-json');

      addRecentlyViewedId('789');

      expect(getRecentlyViewedIds()).toEqual(['789']);
    });
  });

  describe('removeRecentlyViewedId', () => {
    it('removes an ID and dispatches event', () => {
      addRecentlyViewedId('123');
      addRecentlyViewedId('456');

      removeRecentlyViewedId('123');

      expect(getRecentlyViewedIds()).toEqual(['456']);
      expect(dispatchEvent).toHaveBeenCalled();
    });

    it('handles invalid JSON in storage when removing', () => {
      localStorageMock.setItem(RECENTLY_VIEWED_KEY, 'invalid-json');

      removeRecentlyViewedId('123');

      expect(getRecentlyViewedIds()).toEqual([]);
      expect(dispatchEvent).toHaveBeenCalled();
    });
  });
});
