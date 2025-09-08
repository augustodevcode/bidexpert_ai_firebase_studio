
// packages/ui/src/lib/favorite-store.ts
'use client';

const FAVORITE_LOTS_KEY = 'bidExpertFavoriteLotIds'; // Chave específica para este app

export function getFavoriteLotIdsFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(FAVORITE_LOTS_KEY);
  try {
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error parsing favorite lots from localStorage", e);
    return [];
  }
}

export function addFavoriteLotIdToStorage(lotId: string): void {
  if (typeof window === 'undefined' || !lotId) return;
  let ids = getFavoriteLotIdsFromStorage();
  if (!ids.includes(lotId)) {
    ids.push(lotId);
    localStorage.setItem(FAVORITE_LOTS_KEY, JSON.stringify(ids));
    // Dispatch event to notify components like the header
    window.dispatchEvent(new CustomEvent('favorites-updated'));
  }
}

export function removeFavoriteLotIdFromStorage(lotId: string): void {
  if (typeof window === 'undefined' || !lotId) return;
  let ids = getFavoriteLotIdsFromStorage();
  const initialLength = ids.length;
  ids = ids.filter(id => id !== lotId);

  // Only update and dispatch if an item was actually removed
  if (ids.length < initialLength) {
    localStorage.setItem(FAVORITE_LOTS_KEY, JSON.stringify(ids));
    // Dispatch event to notify components like the header
    window.dispatchEvent(new CustomEvent('favorites-updated'));
  }
}

export function isLotFavoriteInStorage(lotId: string): boolean {
  if (typeof window === 'undefined' || !lotId) return false;
  const ids = getFavoriteLotIdsFromStorage();
  return ids.includes(lotId);
}
