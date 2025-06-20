// src/app/admin/roles/queries.ts
import { sampleRoles } from '@/lib/sample-data';
import type { Role } from '@/types';

// This file contains "internal" query-like functions that operate directly on the sample data.
// This decouples the Server Actions from the data source and makes testing easier.

console.log('[Roles Queries] Using sampleRoles data source.');

export async function getRolesInternal(): Promise<Role[]> {
  console.log('[getRolesInternal - SampleData Mode] Fetching from sampleRoles.');
  // Return a deep copy to prevent accidental mutation of the source array
  return Promise.resolve(JSON.parse(JSON.stringify(sampleRoles)));
}

export async function getRoleInternal(id: string): Promise<Role | null> {
  console.log(`[getRoleInternal - SampleData Mode] Fetching role ID: ${id} from sampleRoles.`);
  const role = sampleRoles.find(r => r.id === id);
  // Return a deep copy
  return Promise.resolve(role ? JSON.parse(JSON.stringify(role)) : null);
}

export async function getRoleByNameInternal(name: string): Promise<Role | null> {
  console.log(`[getRoleByNameInternal - SampleData Mode] Fetching role name: ${name} from sampleRoles.`);
  const normalizedName = name.trim().toUpperCase();
  const role = sampleRoles.find(r => r.name_normalized === normalizedName);
  // Return a deep copy
  return Promise.resolve(role ? JSON.parse(JSON.stringify(role)) : null);
}

export async function ensureDefaultRolesExistInternal(): Promise<{ success: boolean; message: string; rolesProcessed?: number }> {
  console.log('[ensureDefaultRolesExistInternal - SampleData Mode] Sample roles are hardcoded, no processing needed.');
  // In a real scenario with sample data, we might check if sampleRoles contains all necessary defaults,
  // but since it's hardcoded, we assume it's correct.
  return Promise.resolve({ success: true, message: 'Default roles are part of sample data.', rolesProcessed: sampleRoles.length });
}
