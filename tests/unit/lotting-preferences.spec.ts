/**
 * @fileoverview Cobre a persistência local das preferências operacionais do loteamento.
 */

import { describe, expect, it } from 'vitest';

import {
  LOTTING_PREFERENCES_STORAGE_KEY,
  getDefaultLottingFilters,
  loadLottingPreferences,
  normalizeLottingPreferences,
  saveLottingPreferences,
} from '@/lib/lotting/preferences';

describe('lotting preferences', () => {
  it('normaliza payload inválido para defaults seguros', () => {
    const normalized = normalizeLottingPreferences({
      mode: 'invalid-mode',
      filters: {
        includeGroupedAssets: 'sim',
        onlyHighlighted: true,
        minimumValuation: -500,
        auctionId: 'should-not-persist',
        judicialProcessId: 'should-not-persist',
      },
    });

    expect(normalized.mode).toBe('quick');
    expect(normalized.filters).toEqual({
      includeGroupedAssets: false,
      onlyHighlighted: true,
      minimumValuation: 0,
    });
  });

  it('salva e recarrega apenas preferências operacionais', () => {
    const memoryStorage = new Map<string, string>();

    const storage = {
      getItem: (key: string) => memoryStorage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memoryStorage.set(key, value);
      },
    };

    const saved = saveLottingPreferences(
      {
        mode: 'ai',
        filters: {
          ...getDefaultLottingFilters(),
          includeGroupedAssets: true,
          onlyHighlighted: true,
          minimumValuation: 250000,
          auctionId: 'auction-1',
          judicialProcessId: 'process-1',
        },
      },
      storage,
    );

    expect(saved.updatedAt).toBeTruthy();

    const rawStored = JSON.parse(memoryStorage.get(LOTTING_PREFERENCES_STORAGE_KEY) ?? '{}');
    expect(rawStored.filters.auctionId).toBeUndefined();
    expect(rawStored.filters.judicialProcessId).toBeUndefined();

    expect(loadLottingPreferences(storage)).toEqual(saved);
  });
});