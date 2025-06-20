// src/app/admin/roles/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { sampleRoles } from '@/lib/sample-data'; // Import sampleRoles for create/delete simulation
import type { Role, RoleFormData } from '@/types';
import { predefinedPermissions } from './role-form-schema';
// Import the internal query functions that work directly on sample-data
import { getRolesInternal, getRoleInternal, getRoleByNameInternal, ensureDefaultRolesExistInternal } from './queries';

console.log('[Roles Actions] Using sample-data source via internal queries.');

// Server Action to create a Role (simulated)
export async function createRole(
  data: RoleFormData
): Promise<{ success: boolean; message: string; roleId?: string }> {
  console.log(`[createRole - SampleData Mode] Simulating creation for: ${data.name}`);
  const existing = sampleRoles.find(r => r.name_normalized === data.name.trim().toUpperCase());
  if (existing) {
    return { success: false, message: `Perfil "${data.name}" já existe nos dados de exemplo.` };
  }
  // This is a simulation. It does not modify the source code `sampleRoles` array.
  // The revalidation call is here to mimic a real-world scenario.
  revalidatePath('/admin/roles');
  return { success: true, message: `Perfil "${data.name}" (simulado) criado com sucesso!`, roleId: `sample-role-${Date.now()}` };
}

// Server Action to get all Roles (uses the internal query)
export async function getRoles(): Promise<Role[]> {
  return getRolesInternal();
}

// Server Action to get a Role by ID (uses the internal query)
export async function getRole(id: string): Promise<Role | null> {
  return getRoleInternal(id);
}

// Server Action to get a Role by name (uses the internal query)
export async function getRoleByName(name: string): Promise<Role | null> {
  return getRoleByNameInternal(name);
}

// Server Action to update a Role (simulated)
export async function updateRole(
  id: string,
  data: Partial<RoleFormData>
): Promise<{ success: boolean; message: string }> {
  console.log(`[updateRole - SampleData Mode] Simulating update for role ID: ${id} with data:`, data);
  // This is a simulation and won't modify the source code array.
  revalidatePath('/admin/roles');
  revalidatePath(`/admin/roles/${id}/edit`);
  return { success: true, message: `Perfil (simulado) atualizado com sucesso!` };
}

// Server Action to delete a Role (simulated)
export async function deleteRole(
  id: string
): Promise<{ success: boolean; message: string }> {
  console.log(`[deleteRole - SampleData Mode] Simulating deletion for role ID: ${id}`);
  const role = sampleRoles.find(r => r.id === id);
  if (role && (role.name_normalized === 'ADMINISTRATOR' || role.name_normalized === 'USER')) {
    return { success: false, message: 'Perfis de sistema (ADMINISTRATOR, USER) não podem ser excluídos (simulação).' };
  }
  // This is a simulation.
  revalidatePath('/admin/roles');
  return { success: true, message: `Perfil (simulado) excluído com sucesso!` };
}

// Server Action to ensure default roles exist (uses the internal query)
export async function ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; rolesProcessed?: number }> {
  return ensureDefaultRolesExistInternal();
}
