// src/lib/favorite-store.ts
'use client';

export const FAVORITE_LOTS_STORAGE_KEY = 'bidExpertFavoriteLotIds'; // Chave específica para este app
const FAVORITE_LOTS_ENDPOINT = '/api/favorite-lots';

export type FavoritePersistenceStatus = 'synced' | 'local-only';

function normalizeFavoriteLotIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const validIds = value.filter((id): id is string => typeof id === 'string' && /^\d+$/.test(id));
  return Array.from(new Set(validIds));
}

function dispatchFavoritesUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('favorites-updated'));
}

function setFavoriteLotIdsInStorage(ids: string[], shouldDispatch = true): string[] {
  const normalizedIds = normalizeFavoriteLotIds(ids);

  if (typeof window === 'undefined') {
    return normalizedIds;
  }

  const nextSerialized = JSON.stringify(normalizedIds);
  const currentSerialized = localStorage.getItem(FAVORITE_LOTS_STORAGE_KEY);

  if (currentSerialized !== nextSerialized) {
    localStorage.setItem(FAVORITE_LOTS_STORAGE_KEY, nextSerialized);
    if (shouldDispatch) {
      dispatchFavoritesUpdated();
    }
  }

  return normalizedIds;
}

async function parseFavoriteLotIdsFromResponse(response: Response): Promise<string[]> {
  const payload = await response.json().catch(() => ({ ids: [] }));
  return normalizeFavoriteLotIds(payload?.ids);
}

async function persistFavoriteLotIdsToServer(lotIds: string[]): Promise<boolean> {
  const normalizedIds = normalizeFavoriteLotIds(lotIds);
  if (typeof window === 'undefined' || normalizedIds.length === 0) return true;

  try {
    const response = await fetch(FAVORITE_LOTS_ENDPOINT, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lotIds: normalizedIds }),
    });

    return response.ok;
  } catch (error) {
    console.warn('Error persisting favorite lots to server', error);
    return false;
  }
}

async function removeFavoriteLotIdFromServer(lotId: string): Promise<boolean> {
  if (typeof window === 'undefined' || !lotId) return true;

  try {
    const response = await fetch(FAVORITE_LOTS_ENDPOINT, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lotId }),
    });

    return response.ok;
  } catch (error) {
    console.warn('Error removing favorite lot from server', error);
    return false;
  }
}

async function getFavoriteLotIdsFromServer(): Promise<string[] | null> {
  if (typeof window === 'undefined') return null;

  try {
    const response = await fetch(FAVORITE_LOTS_ENDPOINT, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Favorite lots fetch failed with status ${response.status}`);
    }

    return await parseFavoriteLotIdsFromResponse(response);
  } catch (error) {
    console.warn('Error fetching favorite lots from server', error);
    return null;
  }
}

export function getFavoriteLotIdsFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(FAVORITE_LOTS_STORAGE_KEY);
  try {
    const parsed = stored ? JSON.parse(stored) : [];
    const validIds = normalizeFavoriteLotIds(parsed);

    if (stored !== JSON.stringify(validIds)) {
      setFavoriteLotIdsInStorage(validIds, false);
    }

    return validIds;
  } catch (e) {
    console.error("Error parsing favorite lots from localStorage", e);
    return [];
  }
}

export function addFavoriteLotIdToStorage(lotId: string): void {
  if (typeof window === 'undefined' || !lotId) return;
  const ids = getFavoriteLotIdsFromStorage();
  if (!ids.includes(lotId)) {
    setFavoriteLotIdsInStorage([...ids, lotId]);
  }
}

export function removeFavoriteLotIdFromStorage(lotId: string): void {
  if (typeof window === 'undefined' || !lotId) return;
  const ids = getFavoriteLotIdsFromStorage().filter(id => id !== lotId);
  setFavoriteLotIdsInStorage(ids);
}

export function isLotFavoriteInStorage(lotId: string): boolean {
  if (typeof window === 'undefined' || !lotId) return false;
  const ids = getFavoriteLotIdsFromStorage();
  return ids.includes(lotId);
}

export async function syncFavoriteLotIdsWithServer(): Promise<string[]> {
  const localIds = getFavoriteLotIdsFromStorage();
  const persistedIds = await getFavoriteLotIdsFromServer();

  if (persistedIds === null) {
    return localIds;
  }

  const mergedIds = Array.from(new Set([...persistedIds, ...localIds]));
  const idsMissingOnServer = mergedIds.filter(id => !persistedIds.includes(id));

  if (idsMissingOnServer.length > 0) {
    await persistFavoriteLotIdsToServer(idsMissingOnServer);
  }

  return setFavoriteLotIdsInStorage(mergedIds);
}

export async function addFavoriteLot(lotId: string): Promise<FavoritePersistenceStatus> {
  addFavoriteLotIdToStorage(lotId);
  const persisted = await persistFavoriteLotIdsToServer([lotId]);
  return persisted ? 'synced' : 'local-only';
}

export async function removeFavoriteLot(lotId: string): Promise<FavoritePersistenceStatus> {
  removeFavoriteLotIdFromStorage(lotId);
  const persisted = await removeFavoriteLotIdFromServer(lotId);
  return persisted ? 'synced' : 'local-only';
}
