/**
 * @fileoverview Server Actions para CRUD de Cidade (City) no Admin Plus.
 * Utiliza createAdminAction para autenticação, permissão e validação Zod.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { CityService } from '@/services/city.service';
import { createCitySchema, updateCitySchema } from './schema';
import { z } from 'zod';

const cityService = new CityService();

/* ─── List ─── */
export const listCitiesAction = createAdminAction({
  requiredPermission: 'cities:read',
  handler: async () => {
    const cities = await cityService.getCities();
    return { data: cities, total: cities.length, page: 1, pageSize: cities.length, totalPages: 1 };
  },
});

/* ─── Get by ID ─── */
const getByIdSchema = z.object({ id: z.string() });

export const getCityByIdAction = createAdminAction({
  inputSchema: getByIdSchema,
  requiredPermission: 'cities:read',
  handler: async ({ input }) => {
    return cityService.getCityById(input.id);
  },
});

/* ─── Create ─── */
export const createCityAction = createAdminAction({
  inputSchema: createCitySchema,
  requiredPermission: 'cities:create',
  handler: async ({ input }) => {
    const result = await cityService.createCity(input);
    if (!result.success) throw new Error(result.message);
    return result;
  },
});

/* ─── Update ─── */
const updateInputSchema = z.object({
  id: z.string(),
  data: updateCitySchema,
});

export const updateCityAction = createAdminAction({
  inputSchema: updateInputSchema,
  requiredPermission: 'cities:update',
  handler: async ({ input }) => {
    const result = await cityService.updateCity(input.id, input.data);
    if (!result.success) throw new Error(result.message);
    return result;
  },
});

/* ─── Delete ─── */
const deleteInputSchema = z.object({ id: z.string() });

export const deleteCityAction = createAdminAction({
  inputSchema: deleteInputSchema,
  requiredPermission: 'cities:delete',
  handler: async ({ input }) => {
    const result = await cityService.deleteCity(input.id);
    if (!result.success) throw new Error(result.message);
    return result;
  },
});
