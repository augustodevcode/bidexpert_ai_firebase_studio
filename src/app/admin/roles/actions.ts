
// src/app/admin/roles/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { Role, RoleFormData } from '@/types';
import { predefinedPermissions } from './role-form-schema';
import { getRolesInternal, getRoleInternal, getRoleByNameInternal, ensureDefaultRolesExistInternal } from './queries'; // ensureDefaultRolesExistInternal importado

// Server Action para criar um Role
export async function createRole(
  data: RoleFormData
): Promise<{ success: boolean; message: string; roleId?: string }> {
  const db = getDatabaseAdapter();
  const result = await db.createRole(data);
  if (result.success) {
    revalidatePath('/admin/roles');
  }
  return result;
}

// Server Action para buscar todos os Roles
export async function getRoles(): Promise<Role[]> {
  return getRolesInternal();
}

// Server Action para buscar um Role por ID
export async function getRole(id: string): Promise<Role | null> {
  return getRoleInternal(id);
}

// Server Action para buscar um Role por nome
export async function getRoleByName(name: string): Promise<Role | null> {
  return getRoleByNameInternal(name);
}

// Server Action para atualizar um Role
export async function updateRole(
  id: string,
  data: Partial<RoleFormData>
): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  const result = await db.updateRole(id, data);
  if (result.success) {
    revalidatePath('/admin/roles');
    revalidatePath(`/admin/roles/${id}/edit`);
  }
  return result;
}

// Server Action para deletar um Role
export async function deleteRole(
  id: string
): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  const result = await db.deleteRole(id);
  if (result.success) {
    revalidatePath('/admin/roles');
  }
  return result;
}

// Server Action para garantir que os perfis padrão existam
export async function ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; rolesProcessed?: number }> {
  return ensureDefaultRolesExistInternal();
}


    