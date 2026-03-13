/**
 * @fileoverview Zod schemas para criação e edição de Modelos de Veículo no Admin Plus.
 */
import { z } from 'zod';

export const createVehicleModelSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório (mín. 2 caracteres)'),
  makeId: z.string().min(1, 'Marca é obrigatória'),
});

export const updateVehicleModelSchema = createVehicleModelSchema.partial();

export type CreateVehicleModelInput = z.infer<typeof createVehicleModelSchema>;
export type UpdateVehicleModelInput = z.infer<typeof updateVehicleModelSchema>;
