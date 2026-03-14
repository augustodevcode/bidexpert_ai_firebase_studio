/**
 * @fileoverview Server Actions para CRUD de Roles no Admin Plus.
 */
'use server';

import { z } from 'zod';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { RoleService } from '@/services/role.service';
import { createRoleSchema, updateRoleSchema } from './schema';

const roleService = new RoleService();

export const listRolesAction = createAdminAction({
  requiredPermission: 'roles:read',
  handler: async () => {
    const rows = await roleService.getRoles();
    return { data: rows, total: rows.length, page: 1, pageSize: rows.length || 25, totalPages: 1 };
  },
});

export const getRoleByIdAction = createAdminAction({
  requiredPermission: 'roles:read',
  inputSchema: z.object({ id: z.string() }),
  handler: async ({ input }) => {
    const row = await roleService.getRoleById(input.id);
    if (!row) throw new Error('Perfil não encontrado');
    return row;
  },
});

export const createRoleAction = createAdminAction({
  requiredPermission: 'roles:create',
  inputSchema: createRoleSchema,
  handler: async ({ input }) => {
    const result = await roleService.createRole({
      name: input.name,
      description: input.description || null,
      permissions: input.permissions ? JSON.parse(input.permissions) : null,
    });
    if (!result.success) throw new Error(result.message);
    return { id: result.roleId ? String(result.roleId) : '' };
  },
});

export const updateRoleAction = createAdminAction({
  requiredPermission: 'roles:update',
  inputSchema: z.object({ id: z.string(), data: updateRoleSchema }),
  handler: async ({ input }) => {
    const payload: Record<string, unknown> = {};
    if (input.data.name !== undefined) payload.name = input.data.name;
    if (input.data.description !== undefined) payload.description = input.data.description || null;
    if (input.data.permissions !== undefined) payload.permissions = input.data.permissions ? JSON.parse(input.data.permissions) : null;
    const result = await roleService.updateRole(input.id, payload as Parameters<typeof roleService.updateRole>[1]);
    if (!result.success) throw new Error(result.message);
  },
});

export const deleteRoleAction = createAdminAction({
  requiredPermission: 'roles:delete',
  inputSchema: z.object({ id: z.string() }),
  handler: async ({ input }) => {
    const result = await roleService.deleteRole(input.id);
    if (!result.success) throw new Error(result.message);
  },
});

export const listRoles = listRolesAction;
export const getRoleById = getRoleByIdAction;
export const createRole = createRoleAction;
export const updateRole = updateRoleAction;
export const deleteRole = deleteRoleAction;
