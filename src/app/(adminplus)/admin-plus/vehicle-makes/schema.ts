/**
 * @fileoverview Schema Zod para validação de VehicleMake no Admin Plus.
 */
import { z } from 'zod';

export const createVehicleMakeSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
});

export const updateVehicleMakeSchema = createVehicleMakeSchema.partial();

export type CreateVehicleMakeInput = z.infer<typeof createVehicleMakeSchema>;
