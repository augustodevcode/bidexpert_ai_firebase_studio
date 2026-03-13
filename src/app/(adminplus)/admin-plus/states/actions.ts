/**
 * @fileoverview Server Actions para CRUD de Estado (State) no Admin Plus.
 * Utiliza createAdminAction para autenticação, permissão e validação Zod.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { StateService } from '@/services/state.service';
import { createStateSchema, updateStateSchema } from './schema';
import { z } from 'zod';

const stateService = new StateService();

/* ─── List ─── */
export const listStatesAction = createAdminAction({
  requiredPermission: 'states:read',
  handler: async () => {
    const states = await stateService.getStates();
    return { data: states, total: states.length, page: 1, pageSize: states.length, totalPages: 1 };
  },
});

/* ─── Get by ID ─── */
const getByIdSchema = z.object({ id: z.string() });

export const getStateByIdAction = createAdminAction({
  inputSchema: getByIdSchema,
  requiredPermission: 'states:read',
  handler: async ({ input }) => {
    return stateService.getStateById(input.id);
  },
});

/* ─── Create ─── */
export const createStateAction = createAdminAction({
  inputSchema: createStateSchema,
  requiredPermission: 'states:create',
  handler: async ({ input }) => {
    return stateService.createState(input);
  },
});

/* ─── Update ─── */
const updateInputSchema = z.object({
  id: z.string(),
  data: updateStateSchema,
});

export const updateStateAction = createAdminAction({
  inputSchema: updateInputSchema,
  requiredPermission: 'states:update',
  handler: async ({ input }) => {
    return stateService.updateState(input.id, input.data);
  },
});

/* ─── Delete ─── */
const deleteInputSchema = z.object({ id: z.string() });

export const deleteStateAction = createAdminAction({
  inputSchema: deleteInputSchema,
  requiredPermission: 'states:delete',
  handler: async ({ input }) => {
    return stateService.deleteState(input.id);
  },
});
