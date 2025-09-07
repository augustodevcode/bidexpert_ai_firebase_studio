// packages/ui/src/lib/recently-viewed-store.ts
'use client';

const RECENTLY_VIEWED_KEY = 'recentlyViewedLots';
const MAX_RECENTLY_VIEWED = 10;
const EXPIRATION_DAYS = 3; // 3-day expiration

interface RecentlyViewedItem {
  id: string;
  timestamp: number; // Store as milliseconds
}

export function getRecentlyViewedIds(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
  try {
    const parsed: RecentlyViewedItem[] = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];

    const now = Date.now();
    const expirationTime = EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

    const validItems = parsed.filter(item => {
      // Ensure item has a timestamp, default to 0 if not for safety.
      const itemTimestamp = item.timestamp || 0;
      return (now - itemTimestamp) < expirationTime;
    });

    // Optional: clean up localStorage if it has expired items
    if (validItems.length < parsed.length) {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(validItems));
    }

    return validItems.map(item => item.id);
  } catch (e) {
    console.error("Error parsing recently viewed lots from localStorage", e);
    return [];
  }
}

export function addRecentlyViewedId(lotId: string): void {
  if (typeof window === 'undefined' || !lotId) {
    return;
  }
  
  let items: RecentlyViewedItem[] = [];
  const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
  try {
    const parsed: RecentlyViewedItem[] = stored ? JSON.parse(stored) : [];
    if (Array.isArray(parsed)) {
      items = parsed;
    }
  } catch (e) {
    items = [];
  }
  
  // Remove if it already exists to move it to the top
  items = items.filter(item => item.id !== lotId);
  
  // Add the new item to the beginning of the array
  items.unshift({ id: lotId, timestamp: Date.now() });

  // Keep the list at the maximum size
  const updatedItems = items.slice(0, MAX_RECENTLY_VIEWED);
  
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updatedItems));
}

export function removeRecentlyViewedId(lotId: string): void {
  if (typeof window === 'undefined' || !lotId) return;
  
  let items: RecentlyViewedItem[] = [];
  const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
  try {
    const parsed: RecentlyViewedItem[] = stored ? JSON.parse(stored) : [];
    if (Array.isArray(parsed)) {
      items = parsed;
    }
  } catch (e) {
    items = [];
  }
  
  const updatedItems = items.filter(item => item.id !== lotId);
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updatedItems));
  
  // Dispatch an event so other components (like the header) can update
  window.dispatchEvent(new CustomEvent('recently-viewed-updated'));
}
