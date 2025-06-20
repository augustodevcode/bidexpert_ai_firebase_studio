
// src/app/admin/roles/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { sampleRoles } from '@/lib/sample-data'; // Import sampleRoles
import type { Role, RoleFormData } from '@/types';
import { predefinedPermissions } from './role-form-schema'; // Still useful for validation
import { getRolesInternal, getRoleInternal, getRoleByNameInternal, ensureDefaultRolesExistInternal } from './queries';

console.log('[Roles Actions] Using sampleRoles data source.');

// Server Action para criar um Role (simulado)
export async function createRole(
  data: RoleFormData
): Promise<{ success: boolean; message: string; roleId?: string }> {
  console.log(`[createRole - SampleData Mode] Simulating creation for: ${data.name}`);
  const existing = sampleRoles.find(r => r.name_normalized === data.name.trim().toUpperCase());
  if (existing) {
    return { success: false, message: `Perfil "${data.name}" já existe nos dados de exemplo.` };
  }
  // Não modifica o array sampleRoles em memória, apenas simula.
  revalidatePath('/admin/roles');
  return { success: true, message: `Perfil "${data.name}" (simulado) criado!`, roleId: `sample-role-${Date.now()}` };
}

// Server Action para buscar todos os Roles (usa a query interna)
export async function getRoles(): Promise<Role[]> {
  return getRolesInternal();
}

// Server Action para buscar um Role por ID (usa a query interna)
export async function getRole(id: string): Promise<Role | null> {
  return getRoleInternal(id);
}

// Server Action para buscar um Role por nome (usa a query interna)
export async function getRoleByName(name: string): Promise<Role | null> {
  return getRoleByNameInternal(name);
}

// Server Action para atualizar um Role (simulado)
export async function updateRole(
  id: string,
  data: Partial<RoleFormData>
): Promise<{ success: boolean; message: string }> {
  console.log(`[updateRole - SampleData Mode] Simulating update for role ID: ${id}`);
  // Não modifica o array sampleRoles em memória.
  revalidatePath('/admin/roles');
  revalidatePath(`/admin/roles/${id}/edit`);
  return { success: true, message: `Perfil (simulado) atualizado!` };
}

// Server Action para deletar um Role (simulado)
export async function deleteRole(
  id: string
): Promise<{ success: boolean; message: string }> {
  console.log(`[deleteRole - SampleData Mode] Simulating deletion for role ID: ${id}`);
  const role = sampleRoles.find(r => r.id === id);
  if (role && (role.name_normalized === 'ADMINISTRATOR' || role.name_normalized === 'USER')) {
    return { success: false, message: 'Perfis de sistema (ADMINISTRATOR, USER) não podem ser excluídos (simulado).' };
  }
  // Não modifica o array sampleRoles em memória.
  revalidatePath('/admin/roles');
  return { success: true, message: `Perfil (simulado) excluído!` };
}

// Server Action para garantir que os perfis padrão existam (usa a query interna)
export async function ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; rolesProcessed?: number }> {
  return ensureDefaultRolesExistInternal();
}
