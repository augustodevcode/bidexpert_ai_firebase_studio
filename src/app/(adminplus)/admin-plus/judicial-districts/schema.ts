/**
 * @fileoverview Schema Zod para JudicialDistrict — Admin Plus.
 */
import { z } from 'zod';

export const judicialDistrictSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório'),
  courtId: z.string().or(z.literal('')).optional(),
  stateId: z.string().or(z.literal('')).optional(),
  zipCode: z.string().or(z.literal('')).optional(),
});

export type JudicialDistrictSchema = z.infer<typeof judicialDistrictSchema>;
