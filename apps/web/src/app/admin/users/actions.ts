
// src/app/admin/users/actions.ts
'use server';

import type { EditableUserProfileData, UserCreationData, UserProfileWithPermissions } from '@bidexpert/core';
import { UserService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const userService = new UserService();
const {
    obterTodos: getUsersWithRoles,
    obterPorId: getUserProfileData,
    criar: createUser,
    atualizar: updateUser,
    excluir: deleteUser,
} = createCrudActions({
    service: userService,
    entityName: 'Usuário',
    routeBase: '/admin/users'
});

export { getUsersWithRoles, getUserProfileData, createUser, updateUser, deleteUser };


// --- Ações Específicas ---

export async function getAdminUserForDev(): Promise<UserProfileWithPermissions | null> {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  return userService.findUserByEmail('admin@bidexpert.com.br');
}

export async function updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{success: boolean; message: string}> {
  return userService.updateUserProfile(userId, data);
}

export async function updateUserRoles(userId: string, roleIds: string[]): Promise<{success: boolean; message: string}> {
  return userService.updateUserRoles(userId, roleIds);
}
