/**
 * @fileoverview Server Actions para CRUD de Modelo de Veículo no Admin Plus.
 * Utiliza createAdminAction para autenticação, permissão e validação Zod.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { VehicleModelService } from '@/services/vehicle-model.service';
import { createVehicleModelSchema, updateVehicleModelSchema } from './schema';
import { z } from 'zod';

const vehicleModelService = new VehicleModelService();

/* ─── List ─── */
export const listVehicleModelsAction = createAdminAction({
  requiredPermission: 'vehicle-models:read',
  handler: async () => {
    const models = await vehicleModelService.getVehicleModels();
    return { data: models, total: models.length, page: 1, pageSize: models.length, totalPages: 1 };
  },
});

/* ─── Get by ID ─── */
const getByIdSchema = z.object({ id: z.string() });

export const getVehicleModelByIdAction = createAdminAction({
  inputSchema: getByIdSchema,
  requiredPermission: 'vehicle-models:read',
  handler: async ({ input }) => {
    return vehicleModelService.getVehicleModelById(input.id);
  },
});

/* ─── Create ─── */
export const createVehicleModelAction = createAdminAction({
  inputSchema: createVehicleModelSchema,
  requiredPermission: 'vehicle-models:create',
  handler: async ({ input }) => {
    const result = await vehicleModelService.createVehicleModel(input);
    if (!result.success) throw new Error(result.message);
    return result;
  },
});

/* ─── Update ─── */
const updateInputSchema = z.object({
  id: z.string(),
  data: updateVehicleModelSchema,
});

export const updateVehicleModelAction = createAdminAction({
  inputSchema: updateInputSchema,
  requiredPermission: 'vehicle-models:update',
  handler: async ({ input }) => {
    const result = await vehicleModelService.updateVehicleModel(input.id, input.data);
    if (!result.success) throw new Error(result.message);
    return result;
  },
});

/* ─── Delete ─── */
const deleteInputSchema = z.object({ id: z.string() });

export const deleteVehicleModelAction = createAdminAction({
  inputSchema: deleteInputSchema,
  requiredPermission: 'vehicle-models:delete',
  handler: async ({ input }) => {
    const result = await vehicleModelService.deleteVehicleModel(input.id);
    if (!result.success) throw new Error(result.message);
    return result;
  },
});
