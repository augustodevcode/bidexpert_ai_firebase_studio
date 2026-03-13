/**
 * @fileoverview Schema Zod para ThemeSettings — Admin Plus.
 * Campos: name (unique), light/dark JSON (via ThemeColors child), platformSettingsId.
 */
import { z } from 'zod';

export const themeSettingsSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  platformSettingsId: z.string().nullable().optional(),
  light: z.any().nullable().optional(),
  dark: z.any().nullable().optional(),
});

export type ThemeSettingsFormValues = z.infer<typeof themeSettingsSchema>;
