
// src/app/admin/roles/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { Role, RoleFormData } from '@/types';
import { predefinedPermissions } from './role-form-schema';

// Server Action to create a Role
export async function createRole(
  data: RoleFormData
): Promise<{ success: boolean; message: string; roleId?: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.createRole(data);
  if (result.success) {
    revalidatePath('/admin/roles');
  }
  return result;
}

// Server Action to get all Roles
export async function getRoles(): Promise<Role[]> {
  const db = await getDatabaseAdapter();
  return db.getRoles();
}

// Server Action to get a Role by ID
export async function getRole(id: string): Promise<Role | null> {
  const db = await getDatabaseAdapter();
  return db.getRole(id);
}

// Server Action to get a Role by name
export async function getRoleByName(name: string): Promise<Role | null> {
  const db = await getDatabaseAdapter();
  return db.getRoleByName(name);
}

// Server Action to update a Role
export async function updateRole(
  id: string,
  data: Partial<RoleFormData>
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.updateRole(id, data);
  if (result.success) {
    revalidatePath('/admin/roles');
    revalidatePath(`/admin/roles/${id}/edit`);
  }
  return result;
}

// Server Action to delete a Role
export async function deleteRole(
  id: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.deleteRole(id);
  if (result.success) {
    revalidatePath('/admin/roles');
  }
  return result;
}

// Server Action to ensure default roles exist
export async function ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; rolesProcessed?: number }> {
  const db = await getDatabaseAdapter();
  return db.ensureDefaultRolesExist();
}
