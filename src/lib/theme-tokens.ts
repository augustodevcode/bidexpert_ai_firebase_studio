/**
 * @fileoverview Define tokens de tema do Design System ShadCN e seus valores padrão.
 * Centraliza metadados para UI e mapeamento de CSS variables.
 */

export type ThemeTokenKey =
  | 'background'
  | 'foreground'
  | 'card'
  | 'cardForeground'
  | 'popover'
  | 'popoverForeground'
  | 'primary'
  | 'primaryForeground'
  | 'secondary'
  | 'secondaryForeground'
  | 'muted'
  | 'mutedForeground'
  | 'accent'
  | 'accentForeground'
  | 'destructive'
  | 'destructiveForeground'
  | 'border'
  | 'input'
  | 'ring'
  | 'chart1'
  | 'chart2'
  | 'chart3'
  | 'chart4'
  | 'chart5'
  | 'sidebarBackground'
  | 'sidebarForeground'
  | 'sidebarPrimary'
  | 'sidebarPrimaryForeground'
  | 'sidebarAccent'
  | 'sidebarAccentForeground'
  | 'sidebarBorder'
  | 'sidebarRing';

export type ThemeTokens = Partial<Record<ThemeTokenKey, string | null>>;

export interface ThemeTokenField {
  key: ThemeTokenKey;
  label: string;
  description?: string;
}

export interface ThemeTokenGroup {
  id: string;
  title: string;
  fields: ThemeTokenField[];
}

export const themeTokenGroups: ThemeTokenGroup[] = [
  {
    id: 'base',
    title: 'Base',
    fields: [
      { key: 'background', label: 'Fundo', description: 'Ex: 0 0% 100%' },
      { key: 'foreground', label: 'Texto', description: 'Ex: 20 14.3% 4.1%' },
      { key: 'card', label: 'Card' },
      { key: 'cardForeground', label: 'Texto do Card' },
      { key: 'popover', label: 'Popover' },
      { key: 'popoverForeground', label: 'Texto do Popover' },
    ],
  },
  {
    id: 'brand',
    title: 'Marca & Estados',
    fields: [
      { key: 'primary', label: 'Primária' },
      { key: 'primaryForeground', label: 'Texto da Primária' },
      { key: 'secondary', label: 'Secundária' },
      { key: 'secondaryForeground', label: 'Texto da Secundária' },
      { key: 'accent', label: 'Destaque' },
      { key: 'accentForeground', label: 'Texto do Destaque' },
      { key: 'muted', label: 'Neutro' },
      { key: 'mutedForeground', label: 'Texto do Neutro' },
      { key: 'destructive', label: 'Destrutivo' },
      { key: 'destructiveForeground', label: 'Texto do Destrutivo' },
    ],
  },
  {
    id: 'borders',
    title: 'Bordas & Foco',
    fields: [
      { key: 'border', label: 'Borda' },
      { key: 'input', label: 'Input' },
      { key: 'ring', label: 'Ring (Foco)' },
    ],
  },
  {
    id: 'charts',
    title: 'Gráficos',
    fields: [
      { key: 'chart1', label: 'Chart 1' },
      { key: 'chart2', label: 'Chart 2' },
      { key: 'chart3', label: 'Chart 3' },
      { key: 'chart4', label: 'Chart 4' },
      { key: 'chart5', label: 'Chart 5' },
    ],
  },
  {
    id: 'sidebar',
    title: 'Sidebar',
    fields: [
      { key: 'sidebarBackground', label: 'Fundo' },
      { key: 'sidebarForeground', label: 'Texto' },
      { key: 'sidebarPrimary', label: 'Primária' },
      { key: 'sidebarPrimaryForeground', label: 'Texto da Primária' },
      { key: 'sidebarAccent', label: 'Destaque' },
      { key: 'sidebarAccentForeground', label: 'Texto do Destaque' },
      { key: 'sidebarBorder', label: 'Borda' },
      { key: 'sidebarRing', label: 'Ring (Foco)' },
    ],
  },
];

export const themeTokenCssVariables: Record<ThemeTokenKey, string> = {
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  popover: '--popover',
  popoverForeground: '--popover-foreground',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  destructive: '--destructive',
  destructiveForeground: '--destructive-foreground',
  border: '--border',
  input: '--input',
  ring: '--ring',
  chart1: '--chart-1',
  chart2: '--chart-2',
  chart3: '--chart-3',
  chart4: '--chart-4',
  chart5: '--chart-5',
  sidebarBackground: '--sidebar-background',
  sidebarForeground: '--sidebar-foreground',
  sidebarPrimary: '--sidebar-primary',
  sidebarPrimaryForeground: '--sidebar-primary-foreground',
  sidebarAccent: '--sidebar-accent',
  sidebarAccentForeground: '--sidebar-accent-foreground',
  sidebarBorder: '--sidebar-border',
  sidebarRing: '--sidebar-ring',
};

export const defaultThemeTokensLight: ThemeTokens = {
  background: '0 0% 100%',
  foreground: '20 14.3% 4.1%',
  card: '0 0% 100%',
  cardForeground: '20 14.3% 4.1%',
  popover: '0 0% 100%',
  popoverForeground: '20 14.3% 4.1%',
  primary: '25 95% 53%',
  primaryForeground: '60 9.1% 97.8%',
  secondary: '60 4.8% 95.9%',
  secondaryForeground: '24 9.8% 10%',
  muted: '60 4.8% 95.9%',
  mutedForeground: '25 5.3% 44.7%',
  accent: '60 4.8% 95.9%',
  accentForeground: '24 9.8% 10%',
  destructive: '0 84.2% 60.2%',
  destructiveForeground: '60 9.1% 97.8%',
  border: '20 5.9% 90%',
  input: '20 5.9% 90%',
  ring: '25 95% 53%',
  chart1: '25 95% 53%',
  chart2: '173 58% 39%',
  chart3: '197 37% 24%',
  chart4: '43 74% 66%',
  chart5: '27 87% 67%',
  sidebarBackground: '30 6% 96%',
  sidebarForeground: '20 14.3% 4.1%',
  sidebarPrimary: '25 95% 53%',
  sidebarPrimaryForeground: '60 9.1% 97.8%',
  sidebarAccent: '30 6% 90%',
  sidebarAccentForeground: '20 14.3% 4.1%',
  sidebarBorder: '20 5.9% 90%',
  sidebarRing: '25 95% 53%',
};

export const defaultThemeTokensDark: ThemeTokens = {
  background: '20 14.3% 4.1%',
  foreground: '60 9.1% 97.8%',
  card: '20 14.3% 4.1%',
  cardForeground: '60 9.1% 97.8%',
  popover: '20 14.3% 4.1%',
  popoverForeground: '60 9.1% 97.8%',
  primary: '25 95% 53%',
  primaryForeground: '60 9.1% 97.8%',
  secondary: '12 6.5% 15.1%',
  secondaryForeground: '60 9.1% 97.8%',
  muted: '12 6.5% 15.1%',
  mutedForeground: '24 5.4% 63.9%',
  accent: '12 6.5% 15.1%',
  accentForeground: '60 9.1% 97.8%',
  destructive: '0 72.2% 50.6%',
  destructiveForeground: '60 9.1% 97.8%',
  border: '12 6.5% 15.1%',
  input: '12 6.5% 15.1%',
  ring: '25 95% 53%',
  chart1: '25 95% 53%',
  chart2: '160 60% 45%',
  chart3: '30 80% 55%',
  chart4: '280 65% 60%',
  chart5: '340 75% 55%',
  sidebarBackground: '20 14.3% 6%',
  sidebarForeground: '60 9.1% 97.8%',
  sidebarPrimary: '25 95% 53%',
  sidebarPrimaryForeground: '60 9.1% 97.8%',
  sidebarAccent: '12 6.5% 12%',
  sidebarAccentForeground: '60 9.1% 97.8%',
  sidebarBorder: '12 6.5% 15.1%',
  sidebarRing: '25 95% 53%',
};

export const defaultRadiusValue = '0.5rem';
