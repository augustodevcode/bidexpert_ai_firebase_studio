/**
 * @fileoverview Persistência local das preferências operacionais do loteamento.
 */

import type { LottingFilterState, LottingMode } from '@/types/lotting';

export const LOTTING_PREFERENCES_STORAGE_KEY = 'bidexpert.admin.lotting.preferences.v1';

export interface LottingPreferences {
  mode: LottingMode;
  filters: LottingFilterState;
  updatedAt?: string;
}

const DEFAULT_FILTERS: LottingFilterState = {
  includeGroupedAssets: false,
  onlyHighlighted: false,
  minimumValuation: 0,
};

export function getDefaultLottingFilters(): LottingFilterState {
  return {
    ...DEFAULT_FILTERS,
  };
}

function normalizeMode(value: unknown): LottingMode {
  if (value === 'spreadsheet' || value === 'ai') {
    return value;
  }

  return 'quick';
}

function normalizeFilters(raw: unknown): LottingFilterState {
  if (!raw || typeof raw !== 'object') {
    return getDefaultLottingFilters();
  }

  const filters = raw as LottingFilterState;

  return {
    includeGroupedAssets:
      typeof filters.includeGroupedAssets === 'boolean'
        ? filters.includeGroupedAssets
        : DEFAULT_FILTERS.includeGroupedAssets,
    onlyHighlighted:
      typeof filters.onlyHighlighted === 'boolean'
        ? filters.onlyHighlighted
        : DEFAULT_FILTERS.onlyHighlighted,
    minimumValuation:
      typeof filters.minimumValuation === 'number' && Number.isFinite(filters.minimumValuation)
        ? Math.max(0, filters.minimumValuation)
        : DEFAULT_FILTERS.minimumValuation,
  };
}

export function normalizeLottingPreferences(raw: unknown): LottingPreferences {
  if (!raw || typeof raw !== 'object') {
    return {
      mode: 'quick',
      filters: getDefaultLottingFilters(),
    };
  }

  const preferences = raw as LottingPreferences;

  return {
    mode: normalizeMode(preferences.mode),
    filters: normalizeFilters(preferences.filters),
    updatedAt:
      typeof preferences.updatedAt === 'string' && preferences.updatedAt.length > 0
        ? preferences.updatedAt
        : undefined,
  };
}

export function loadLottingPreferences(storage?: Pick<Storage, 'getItem'> | null): LottingPreferences {
  if (!storage) {
    return normalizeLottingPreferences(undefined);
  }

  try {
    const raw = storage.getItem(LOTTING_PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return normalizeLottingPreferences(undefined);
    }

    return normalizeLottingPreferences(JSON.parse(raw));
  } catch {
    return normalizeLottingPreferences(undefined);
  }
}

export function saveLottingPreferences(
  preferences: LottingPreferences,
  storage?: Pick<Storage, 'setItem'> | null,
): LottingPreferences {
  const normalized = normalizeLottingPreferences({
    ...preferences,
    updatedAt: new Date().toISOString(),
  });

  if (storage) {
    storage.setItem(LOTTING_PREFERENCES_STORAGE_KEY, JSON.stringify(normalized));
  }

  return normalized;
}