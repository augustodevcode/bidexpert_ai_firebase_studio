/**
 * @fileoverview Tipos serializados para listagem de ThemeSettings — Admin Plus.
 */
export interface ThemeSettingsRow {
  id: string;
  name: string;
  platformSettingsId: string | null;
  light: unknown;
  dark: unknown;
}
