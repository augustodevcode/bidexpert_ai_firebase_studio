/**
 * @fileoverview Hook for managing lineage node color theme customization.
 * Persists color overrides per node type to localStorage.
 */
'use client';

import { useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { LineageNodeType, LineageNodeColorScheme } from '@/types/auction-lineage';

const STORAGE_KEY = 'bidexpert-lineage-theme';

/** Default color scheme for each node type */
const DEFAULT_COLORS: Record<LineageNodeType, LineageNodeColorScheme> = {
  auction:            { bg: 'bg-blue-50 dark:bg-blue-950/30',    border: 'border-blue-300 dark:border-blue-700',    text: 'text-blue-700 dark:text-blue-300',    iconColor: 'text-blue-600 dark:text-blue-400' },
  seller:             { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-300', iconColor: 'text-orange-600 dark:text-orange-400' },
  auctioneer:         { bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-700 dark:text-purple-300', iconColor: 'text-purple-600 dark:text-purple-400' },
  lot:                { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-700 dark:text-emerald-300', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  asset:              { bg: 'bg-teal-50 dark:bg-teal-950/30',    border: 'border-teal-300 dark:border-teal-700',    text: 'text-teal-700 dark:text-teal-300',    iconColor: 'text-teal-600 dark:text-teal-400' },
  category:           { bg: 'bg-amber-50 dark:bg-amber-950/30',  border: 'border-amber-300 dark:border-amber-700',  text: 'text-amber-700 dark:text-amber-300',  iconColor: 'text-amber-600 dark:text-amber-400' },
  city:               { bg: 'bg-cyan-50 dark:bg-cyan-950/30',    border: 'border-cyan-300 dark:border-cyan-700',    text: 'text-cyan-700 dark:text-cyan-300',    iconColor: 'text-cyan-600 dark:text-cyan-400' },
  state:              { bg: 'bg-sky-50 dark:bg-sky-950/30',      border: 'border-sky-300 dark:border-sky-700',      text: 'text-sky-700 dark:text-sky-300',      iconColor: 'text-sky-600 dark:text-sky-400' },
  stage:              { bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-300 dark:border-indigo-700', text: 'text-indigo-700 dark:text-indigo-300', iconColor: 'text-indigo-600 dark:text-indigo-400' },
  habilitation:       { bg: 'bg-rose-50 dark:bg-rose-950/30',    border: 'border-rose-300 dark:border-rose-700',    text: 'text-rose-700 dark:text-rose-300',    iconColor: 'text-rose-600 dark:text-rose-400' },
  'judicial-process': { bg: 'bg-red-50 dark:bg-red-950/30',      border: 'border-red-300 dark:border-red-700',      text: 'text-red-700 dark:text-red-300',      iconColor: 'text-red-600 dark:text-red-400' },
  'judicial-branch':  { bg: 'bg-pink-50 dark:bg-pink-950/30',    border: 'border-pink-300 dark:border-pink-700',    text: 'text-pink-700 dark:text-pink-300',    iconColor: 'text-pink-600 dark:text-pink-400' },
  court:              { bg: 'bg-lime-50 dark:bg-lime-950/30',    border: 'border-lime-300 dark:border-lime-700',    text: 'text-lime-700 dark:text-lime-300',    iconColor: 'text-lime-600 dark:text-lime-400' },
};

/** Available color presets for user selection */
export const COLOR_PRESETS: { name: string; key: string; scheme: LineageNodeColorScheme }[] = [
  { name: 'Azul',     key: 'blue',    scheme: DEFAULT_COLORS.auction },
  { name: 'Laranja',  key: 'orange',  scheme: DEFAULT_COLORS.seller },
  { name: 'Roxo',     key: 'purple',  scheme: DEFAULT_COLORS.auctioneer },
  { name: 'Verde',    key: 'emerald', scheme: DEFAULT_COLORS.lot },
  { name: 'Teal',     key: 'teal',    scheme: DEFAULT_COLORS.asset },
  { name: 'Âmbar',    key: 'amber',   scheme: DEFAULT_COLORS.category },
  { name: 'Lima',     key: 'lime',    scheme: DEFAULT_COLORS.court },
  { name: 'Ciano',    key: 'cyan',    scheme: DEFAULT_COLORS.city },
  { name: 'Céu',      key: 'sky',     scheme: DEFAULT_COLORS.state },
  { name: 'Índigo',   key: 'indigo',  scheme: DEFAULT_COLORS.stage },
  { name: 'Rosa',     key: 'rose',    scheme: DEFAULT_COLORS.habilitation },
  { name: 'Vermelho', key: 'red',     scheme: DEFAULT_COLORS['judicial-process'] },
  { name: 'Pink',     key: 'pink',    scheme: DEFAULT_COLORS.court },
];

type ThemeOverrides = Partial<Record<LineageNodeType, string>>;

export function useLineageTheme() {
  const [overrides, setOverrides] = useLocalStorage<ThemeOverrides>(STORAGE_KEY, {});

  /** Get color scheme for a node type, applying overrides */
  const getColorScheme = useCallback(
    (nodeType: LineageNodeType): LineageNodeColorScheme => {
      const overrideKey = overrides[nodeType];
      if (overrideKey) {
        const preset = COLOR_PRESETS.find((p) => p.key === overrideKey);
        if (preset) return preset.scheme;
      }
      return DEFAULT_COLORS[nodeType];
    },
    [overrides]
  );

  /** Set a color preset override for a node type */
  const setNodeColor = useCallback(
    (nodeType: LineageNodeType, presetKey: string) => {
      setOverrides((prev) => ({ ...prev, [nodeType]: presetKey }));
    },
    [setOverrides]
  );

  /** Reset all color overrides to defaults */
  const resetColors = useCallback(() => {
    setOverrides({});
  }, [setOverrides]);

  return {
    getColorScheme,
    setNodeColor,
    resetColors,
    overrides,
  };
}
