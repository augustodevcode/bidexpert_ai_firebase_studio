/**
 * @fileoverview Schema Zod para SectionBadgeVisibility (visibilidade de badges por contexto).
 * 2 campos JSON: searchGrid e lotDetail (arrays de badge keys exibidos em cada contexto).
 */

import { z } from 'zod';

export const sectionBadgeVisibilitySchema = z.object({
  searchGrid: z.any().optional().default(null),
  lotDetail: z.any().optional().default(null),
});

export type SectionBadgeVisibilityFormValues = z.infer<typeof sectionBadgeVisibilitySchema>;
