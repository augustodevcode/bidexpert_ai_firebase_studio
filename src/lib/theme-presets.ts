/**
 * @file theme-presets.ts
 * @description Define os presets de cores disponíveis para o usuário escolher.
 * Cada preset contém variantes para modo claro e escuro.
 * 
 * DESIGN SYSTEM OFICIAL - BidExpert:
 * - Primary: Orange hsl(25 95% 53%) - CTAs principais
 * - O preset "default" é a base oficial que pode ser restaurada
 */

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  primaryColor: string; // HSL value for preview
  isDefault?: boolean; // Marca o tema padrão oficial
  previewColors: {
    light: { bg: string; primary: string; accent: string };
    dark: { bg: string; primary: string; accent: string };
  };
}

export const themePresets: ThemePreset[] = [
  {
    id: 'default',
    name: 'BidExpert (Padrão)',
    description: 'Tema oficial Orange - Design System Base',
    primaryColor: '25 95% 53%',
    isDefault: true,
    previewColors: {
      light: { bg: '#ffffff', primary: '#f97316', accent: '#fbbf24' },
      dark: { bg: '#0c0a09', primary: '#f97316', accent: '#f59e0b' },
    },
  },
  {
    id: 'blue',
    name: 'Azul',
    description: 'Tema profissional azul',
    primaryColor: '221.2 83.2% 53.3%',
    previewColors: {
      light: { bg: '#ffffff', primary: '#3b82f6', accent: '#60a5fa' },
      dark: { bg: '#030712', primary: '#60a5fa', accent: '#93c5fd' },
    },
  },
  {
    id: 'green',
    name: 'Verde',
    description: 'Tema verde natureza',
    primaryColor: '142.1 76.2% 36.3%',
    previewColors: {
      light: { bg: '#ffffff', primary: '#16a34a', accent: '#22c55e' },
      dark: { bg: '#0c0a09', primary: '#22c55e', accent: '#4ade80' },
    },
  },
  {
    id: 'violet',
    name: 'Violeta',
    description: 'Tema elegante violeta',
    primaryColor: '262.1 83.3% 57.8%',
    previewColors: {
      light: { bg: '#ffffff', primary: '#8b5cf6', accent: '#a78bfa' },
      dark: { bg: '#0c0a09', primary: '#a78bfa', accent: '#c4b5fd' },
    },
  },
  {
    id: 'rose',
    name: 'Rosa',
    description: 'Tema rosa elegante',
    primaryColor: '346.8 77.2% 49.8%',
    previewColors: {
      light: { bg: '#ffffff', primary: '#e11d48', accent: '#fb7185' },
      dark: { bg: '#0c0a09', primary: '#fb7185', accent: '#fda4af' },
    },
  },
  {
    id: 'cyan',
    name: 'Ciano',
    description: 'Tema ciano moderno',
    primaryColor: '199 92% 50%',
    previewColors: {
      light: { bg: '#f5f7fa', primary: '#00a8e8', accent: '#22d3ee' },
      dark: { bg: '#0f1419', primary: '#00b4f0', accent: '#67e8f9' },
    },
  },
];

export const THEME_COLOR_STORAGE_KEY = 'bidexpert-color-theme';

export function getStoredColorTheme(): string {
  if (typeof window === 'undefined') return 'default';
  return localStorage.getItem(THEME_COLOR_STORAGE_KEY) || 'default';
}

export function setStoredColorTheme(themeId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_COLOR_STORAGE_KEY, themeId);
}

export function resetToDefaultTheme(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(THEME_COLOR_STORAGE_KEY);
  // Remove todas as classes de tema
  document.documentElement.classList.forEach(cls => {
    if (cls.startsWith('theme-')) {
      document.documentElement.classList.remove(cls);
    }
  });
}

export function getDefaultPreset(): ThemePreset {
  return themePresets.find(p => p.isDefault) || themePresets[0];
}
