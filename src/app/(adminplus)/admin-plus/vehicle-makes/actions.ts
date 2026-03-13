/**
 * @fileoverview Server Actions para CRUD de VehicleMakes no Admin Plus.
 */
'use server';

import { z } from 'zod';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { VehicleMakeService } from '@/services/vehicle-make.service';
import { createVehicleMakeSchema, updateVehicleMakeSchema } from './schema';

const vehicleMakeService = new VehicleMakeService();

export const listVehicleMakesAction = createAdminAction({
  requiredPermission: 'vehicle-makes:read',
  handler: async () => {
    const rows = await vehicleMakeService.getVehicleMakes();
    return { data: rows, total: rows.length, page: 1, pageSize: rows.length || 25, totalPages: 1 };
  },
});

export const getVehicleMakeByIdAction = createAdminAction({
  requiredPermission: 'vehicle-makes:read',
  inputSchema: z.object({ id: z.string() }),
  handler: async ({ input }) => {
    const row = await vehicleMakeService.getVehicleMakeById(input.id);
    if (!row) throw new Error('Marca não encontrada');
    return row;
  },
});

export const createVehicleMakeAction = createAdminAction({
  requiredPermission: 'vehicle-makes:create',
  inputSchema: createVehicleMakeSchema,
  handler: async ({ input }) => {
    const result = await vehicleMakeService.createVehicleMake({ name: input.name });
    if (!result.success) throw new Error(result.message);
    return { id: result.makeId ?? '' };
  },
});

export const updateVehicleMakeAction = createAdminAction({
  requiredPermission: 'vehicle-makes:update',
  inputSchema: z.object({ id: z.string(), data: updateVehicleMakeSchema }),
  handler: async ({ input }) => {
    const payload: Record<string, unknown> = {};
    if (input.data.name !== undefined) payload.name = input.data.name;
    const result = await vehicleMakeService.updateVehicleMake(input.id, payload as Parameters<typeof vehicleMakeService.updateVehicleMake>[1]);
    if (!result.success) throw new Error(result.message);
  },
});

export const deleteVehicleMakeAction = createAdminAction({
  requiredPermission: 'vehicle-makes:delete',
  inputSchema: z.object({ id: z.string() }),
  handler: async ({ input }) => {
    const result = await vehicleMakeService.deleteVehicleMake(input.id);
    if (!result.success) throw new Error(result.message);
  },
});
