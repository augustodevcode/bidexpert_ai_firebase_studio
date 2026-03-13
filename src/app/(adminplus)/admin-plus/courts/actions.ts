/**
 * @fileoverview Server Actions para CRUD de Comarcas/Tribunais no Admin Plus.
 */
'use server';

import { z } from 'zod';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { CourtService } from '@/services/court.service';
import { createCourtSchema, updateCourtSchema } from './schema';

const courtService = new CourtService();

export const listCourtsAction = createAdminAction({
  requiredPermission: 'courts:read',
  handler: async () => {
    const courts = await courtService.getCourts();
    return { data: courts, total: courts.length, page: 1, pageSize: courts.length || 25, totalPages: 1 };
  },
});

export const getCourtByIdAction = createAdminAction({
  requiredPermission: 'courts:read',
  inputSchema: z.object({ id: z.string() }),
  handler: async ({ input }) => {
    const court = await courtService.getCourtById(input.id);
    if (!court) throw new Error('Tribunal não encontrado');
    return court;
  },
});

export const createCourtAction = createAdminAction({
  requiredPermission: 'courts:create',
  inputSchema: createCourtSchema,
  handler: async ({ input }) => {
    const result = await courtService.createCourt({
      name: input.name,
      stateUf: input.stateUf,
      website: input.website || null,
    });
    if (!result.success) throw new Error(result.message);
    return { id: result.courtId ?? '' };
  },
});

export const updateCourtAction = createAdminAction({
  requiredPermission: 'courts:update',
  inputSchema: z.object({ id: z.string(), data: updateCourtSchema }),
  handler: async ({ input }) => {
    const payload: Record<string, unknown> = {};
    if (input.data.name !== undefined) payload.name = input.data.name;
    if (input.data.stateUf !== undefined) payload.stateUf = input.data.stateUf;
    if (input.data.website !== undefined) payload.website = input.data.website || null;
    const result = await courtService.updateCourt(input.id, payload as Parameters<typeof courtService.updateCourt>[1]);
    if (!result.success) throw new Error(result.message);
  },
});

export const deleteCourtAction = createAdminAction({
  requiredPermission: 'courts:delete',
  inputSchema: z.object({ id: z.string() }),
  handler: async ({ input }) => {
    const result = await courtService.deleteCourt(input.id);
    if (!result.success) throw new Error(result.message);
  },
});
