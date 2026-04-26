/**
 * @fileoverview Persistência em cookie do estado visual do SuperGrid.
 * Mantém largura de colunas e preferências de exibição entre sessões.
 */

import type { GridDensity } from '../SuperGrid.types';

const GRID_STATE_COOKIE_PREFIX = 'bidexpert_supergrid';
const GRID_STATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export interface PersistedGridState {
  columnSizing?: Record<string, number>;
  columnVisibility?: Record<string, boolean>;
  density?: GridDensity;
  grouping?: string[];
}

export function getGridStateCookieName(gridId: string): string {
  return `${GRID_STATE_COOKIE_PREFIX}_${gridId}`;
}

export function readGridStateCookie(
  cookieSource: string | undefined,
  gridId: string
): PersistedGridState {
  if (!cookieSource) {
    return {};
  }

  const cookieName = getGridStateCookieName(gridId);
  const cookieValue = cookieSource
    .split('; ')
    .find(entry => entry.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);

  if (!cookieValue) {
    return {};
  }

  try {
    return JSON.parse(decodeURIComponent(cookieValue)) as PersistedGridState;
  } catch {
    return {};
  }
}

export function readPersistedGridState(gridId: string): PersistedGridState {
  if (typeof document === 'undefined') {
    return {};
  }

  return readGridStateCookie(document.cookie, gridId);
}

export function serializeGridStateCookie(
  gridId: string,
  state: PersistedGridState
): string {
  return `${getGridStateCookieName(gridId)}=${encodeURIComponent(JSON.stringify(state))}; path=/; max-age=${GRID_STATE_COOKIE_MAX_AGE}; samesite=lax`;
}

export function writePersistedGridState(
  gridId: string,
  state: PersistedGridState
): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = serializeGridStateCookie(gridId, state);
}