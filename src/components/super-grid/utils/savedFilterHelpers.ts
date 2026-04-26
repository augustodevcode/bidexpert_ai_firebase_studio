/**
 * @fileoverview Helpers puros para filtros avançados salvos do SuperGrid.
 * Persiste presets nomeados por escopo de usuário e grid dentro de Tenant.metadata.
 */

import { randomUUID } from 'node:crypto';

export interface SavedGridFilter {
  id: string;
  name: string;
  query: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface SuperGridSavedFiltersByScope {
  [scopeId: string]: {
    [gridId: string]: SavedGridFilter[];
  };
}

interface SuperGridPreferences {
  superGrid?: {
    savedFilters?: SuperGridSavedFiltersByScope;
  };
  [key: string]: unknown;
}

interface UpsertSavedGridFilterInput {
  filterId?: string;
  name: string;
  query: Record<string, unknown>;
  now?: string;
  createId?: () => string;
}

function asPreferences(preferences: unknown): SuperGridPreferences {
  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
    return {};
  }

  return preferences as SuperGridPreferences;
}

function getTenantGridFiltersContainer(
  preferences: SuperGridPreferences,
  scopeId: string,
  gridId: string
): SavedGridFilter[] {
  return preferences.superGrid?.savedFilters?.[scopeId]?.[gridId] ?? [];
}

function sortSavedFilters(filters: SavedGridFilter[]): SavedGridFilter[] {
  return [...filters].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function readSavedGridFilters(
  preferences: unknown,
  scopeId: string,
  gridId: string
): SavedGridFilter[] {
  return sortSavedFilters(
    getTenantGridFiltersContainer(asPreferences(preferences), scopeId, gridId)
  );
}

export function upsertSavedGridFilter(
  preferences: unknown,
  scopeId: string,
  gridId: string,
  input: UpsertSavedGridFilterInput
): { preferences: SuperGridPreferences; savedFilter: SavedGridFilter } {
  const currentPreferences = asPreferences(preferences);
  const currentFilters = getTenantGridFiltersContainer(currentPreferences, scopeId, gridId);
  const normalizedName = input.name.trim();
  const timestamp = input.now ?? new Date().toISOString();
  const createId = input.createId ?? (() => randomUUID());

  const existingIndex = currentFilters.findIndex(filter => {
    if (input.filterId) {
      return filter.id === input.filterId;
    }

    return filter.name.trim().toLowerCase() === normalizedName.toLowerCase();
  });

  const existingFilter = existingIndex >= 0 ? currentFilters[existingIndex] : undefined;

  const savedFilter: SavedGridFilter = {
    id: existingFilter?.id ?? input.filterId ?? createId(),
    name: normalizedName,
    query: input.query,
    createdAt: existingFilter?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  const nextFilters = existingIndex >= 0
    ? currentFilters.map((filter, index) => (index === existingIndex ? savedFilter : filter))
    : [...currentFilters, savedFilter];

  const nextPreferences: SuperGridPreferences = {
    ...currentPreferences,
    superGrid: {
      ...(currentPreferences.superGrid ?? {}),
      savedFilters: {
        ...(currentPreferences.superGrid?.savedFilters ?? {}),
        [scopeId]: {
          ...(currentPreferences.superGrid?.savedFilters?.[scopeId] ?? {}),
          [gridId]: sortSavedFilters(nextFilters),
        },
      },
    },
  };

  return { preferences: nextPreferences, savedFilter };
}

export function removeSavedGridFilter(
  preferences: unknown,
  scopeId: string,
  gridId: string,
  filterId: string
): SuperGridPreferences {
  const currentPreferences = asPreferences(preferences);
  const currentFilters = getTenantGridFiltersContainer(currentPreferences, scopeId, gridId);

  const nextFilters = currentFilters.filter(filter => filter.id !== filterId);

  return {
    ...currentPreferences,
    superGrid: {
      ...(currentPreferences.superGrid ?? {}),
      savedFilters: {
        ...(currentPreferences.superGrid?.savedFilters ?? {}),
        [scopeId]: {
          ...(currentPreferences.superGrid?.savedFilters?.[scopeId] ?? {}),
          [gridId]: nextFilters,
        },
      },
    },
  };
}