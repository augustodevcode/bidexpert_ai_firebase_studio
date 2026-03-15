/**
 * @fileoverview Server Actions para a entidade User no Admin Plus.
 * Usa UserService para todas as operações de CRUD com validação de permissões.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { UserService } from '@/services/user.service';
import { z } from 'zod';
import { createUserSchema, updateUserSchema } from './schema';

const userService = new UserService();

export const listUsersAction = createAdminAction({
  requiredPermission: 'manage_users',
  handler: async () => {
    const users = await userService.getUsers();
    const data = users.map((u) => ({
      id: u.id,
      name: u.fullName ?? '',
      fullName: u.fullName ?? '',
      email: u.email,
      accountType: (u.accountType as string) ?? 'PHYSICAL',
      habilitationStatus: (u.habilitationStatus as string) ?? 'PENDING_DOCUMENTS',
      cellPhone: u.cellPhone ?? '',
      roleNames: u.roleNames ?? [],
      createdAt: u.createdAt,
    }));
    return {
      data,
      total: data.length,
      page: 1,
      pageSize: data.length,
      totalPages: 1,
    };
  },
});

export const listUsers = listUsersAction;

export const getUserByIdAction = createAdminAction({
  inputSchema: z.object({ id: z.string() }),
  requiredPermission: 'manage_users',
  handler: async ({ input }) => {
    return await userService.getUserById(input.id);
  },
});

export const createUserAction = createAdminAction({
  inputSchema: createUserSchema,
  requiredPermission: 'manage_users',
  handler: async ({ input, ctx }) => {
    const { roleIds, ...userData } = input;
    return await userService.createUser({
      ...userData,
      roleIds,
      tenantId: ctx.tenantId,
    });
  },
});

export const updateUserAction = createAdminAction({
  inputSchema: z.object({
    id: z.string(),
    data: updateUserSchema,
  }),
  requiredPermission: 'manage_users',
  handler: async ({ input }) => {
    const { roleIds, password, ...profileData } = input.data;

    // Update profile data (and password if provided)
    const passwordData = password && password.length >= 6 ? { password } : {};
    const result = await userService.updateUserProfile(input.id, {
      ...profileData,
      ...passwordData,
    } as any);

    // Update roles if provided
    if (roleIds && roleIds.length > 0) {
      await userService.updateUserRoles(input.id, roleIds);
    }

    return result;
  },
});

export const deleteUserAction = createAdminAction({
  inputSchema: z.object({ id: z.string() }),
  requiredPermission: 'manage_users',
  handler: async ({ input }) => {
    return await userService.deleteUser(input.id);
  },
});

export const getUserById = getUserByIdAction;
export const createUser = createUserAction;
export const updateUser = updateUserAction;
export const deleteUser = deleteUserAction;
