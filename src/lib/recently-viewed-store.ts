
'use client';

const RECENTLY_VIEWED_KEY = 'recentlyViewedLots';
const MAX_RECENTLY_VIEWED = 10; // Updated to 10

export function getRecentlyViewedIds(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addRecentlyViewedId(lotId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  let ids = getRecentlyViewedIds();
  // Remove a ID se já existir para movê-la para o topo
  ids = ids.filter(id => id !== lotId);
  // Adiciona a nova ID no início
  ids.unshift(lotId);
  // Mantém a lista com o tamanho máximo
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids.slice(0, MAX_RECENTLY_VIEWED)));
}
