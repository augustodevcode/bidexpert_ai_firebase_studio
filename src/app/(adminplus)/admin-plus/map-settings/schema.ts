/**
 * @fileoverview Schema Zod para MapSettings (Configurações de Mapa).
 */

import { z } from 'zod';

export const mapSettingsSchema = z.object({
  defaultProvider: z.string().nullable().optional(),
  googleMapsApiKey: z.string().nullable().optional(),
});

export type MapSettingsFormValues = z.infer<typeof mapSettingsSchema>;
