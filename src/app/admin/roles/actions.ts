
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { Role, RoleFormData } from '@/types';

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

export async function getRoles(): Promise<Role[]> {
  const db = getDatabaseAdapter();
  return db.getRoles();
}

export async function getRole(id: string): Promise<Role | null> {
  const db = getDatabaseAdapter();
  return db.getRole(id);
}

export async function getRoleByName(name: string): Promise<Role | null> {
  const db = getDatabaseAdapter();
  return db.getRoleByName(name);
}

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

export async function ensureDefaultRolesExist(): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  return db.ensureDefaultRolesExist();
}
