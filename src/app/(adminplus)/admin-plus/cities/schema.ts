/**
 * @fileoverview Zod schemas para criação e edição de Cidades no Admin Plus.
 */
import { z } from 'zod';

export const createCitySchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório (mín. 2 caracteres)'),
  stateId: z.string().min(1, 'Estado é obrigatório'),
  ibgeCode: z.string().optional(),
  latitude: z.coerce.number().nullable().optional(),
  longitude: z.coerce.number().nullable().optional(),
});

export const updateCitySchema = createCitySchema.partial();

export type CreateCityInput = z.infer<typeof createCitySchema>;
export type UpdateCityInput = z.infer<typeof updateCitySchema>;
