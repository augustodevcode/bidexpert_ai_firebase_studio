/**
 * @fileoverview Testes unitários para sincronização de favoritos entre localStorage e backend.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FAVORITE_LOTS_STORAGE_KEY,
  addFavoriteLot,
  getFavoriteLotIdsFromStorage,
  removeFavoriteLot,
  syncFavoriteLotIdsWithServer,
} from '@/lib/favorite-store';

function createLocalStorageMock() {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
}

describe('favorite-store', () => {
  const localStorageMock = createLocalStorageMock();
  const dispatchEvent = vi.fn();
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('window', { dispatchEvent } as unknown as Window & typeof globalThis);
    vi.stubGlobal(
      'CustomEvent',
      class CustomEventMock {
        constructor(public type: string) {}
      }
    );
    vi.stubGlobal('fetch', fetchMock);

    localStorageMock.clear();
    dispatchEvent.mockReset();
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normaliza IDs inválidos salvos localmente', () => {
    localStorageMock.setItem(FAVORITE_LOTS_STORAGE_KEY, JSON.stringify(['10', 'abc', '10', '22']));

    expect(getFavoriteLotIdsFromStorage()).toEqual(['10', '22']);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(FAVORITE_LOTS_STORAGE_KEY, JSON.stringify(['10', '22']));
  });

  it('mescla favoritos locais com favoritos persistidos no backend', async () => {
    localStorageMock.setItem(FAVORITE_LOTS_STORAGE_KEY, JSON.stringify(['1', '2']));
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ ids: ['2', '3'] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, ids: ['1'] }), { status: 200 }));

    const mergedIds = await syncFavoriteLotIdsWithServer();

    expect(new Set(mergedIds)).toEqual(new Set(['1', '2', '3']));
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/favorite-lots',
      expect.objectContaining({ method: 'GET', cache: 'no-store' })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/favorite-lots',
      expect.objectContaining({ method: 'POST' })
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(FAVORITE_LOTS_STORAGE_KEY, JSON.stringify(['2', '3', '1']));
  });

  it('mantém fallback local quando a persistência remota falha', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'falha' }), { status: 500 }));

    const addStatus = await addFavoriteLot('99');
    expect(addStatus).toBe('local-only');
    expect(getFavoriteLotIdsFromStorage()).toEqual(['99']);

    const removeStatus = await removeFavoriteLot('99');
    expect(removeStatus).toBe('local-only');
    expect(getFavoriteLotIdsFromStorage()).toEqual([]);
  });
});