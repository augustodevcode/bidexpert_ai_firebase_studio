
// src/app/admin/roles/queries.ts
// Este arquivo NÃO deve ter 'use server'; pois contém lógica de DB pura
// e será importado por Server Actions e Server Components.

import { getDatabaseAdapter } from '@/lib/database';
import type { Role } from '@/types';
import { predefinedPermissions } from './role-form-schema'; 

// Renomeado para indicar que é uma função interna de busca
export async function getRolesInternal(): Promise<Role[]> {
  const db = await getDatabaseAdapter();
  console.log(`[getRolesInternal] Adapter received. Type: ${db?.constructor?.name}. Method getRoles is function: ${typeof (db as any)?.getRoles === 'function'}`);
  if (!db || typeof db.getRoles !== 'function') {
    console.error("[getRolesInternal] CRITICAL: db adapter or db.getRoles is not valid.", { adapterType: db?.constructor?.name, hasGetRoles: typeof (db as any)?.getRoles === 'function'});
    throw new Error("Database adapter or getRoles method is not valid in getRolesInternal.");
  }
  return db.getRoles();
}

export async function getRoleInternal(id: string): Promise<Role | null> {
  const db = await getDatabaseAdapter();
  console.log(`[getRoleInternal] Adapter received. Type: ${db?.constructor?.name}. Method getRole is function: ${typeof (db as any)?.getRole === 'function'}`);
  if (!db || typeof db.getRole !== 'function') {
    console.error("[getRoleInternal] CRITICAL: db adapter or db.getRole is not valid.");
    throw new Error("Database adapter or getRole method is not valid in getRoleInternal.");
  }
  return db.getRole(id);
}

export async function getRoleByNameInternal(name: string): Promise<Role | null> {
  const db = await getDatabaseAdapter();
   console.log(`[getRoleByNameInternal] Adapter received. Type: ${db?.constructor?.name}. Method getRoleByName is function: ${typeof (db as any)?.getRoleByName === 'function'}`);
  if (!db || typeof db.getRoleByName !== 'function') {
    console.error("[getRoleByNameInternal] CRITICAL: db adapter or db.getRoleByName is not valid.");
    throw new Error("Database adapter or getRoleByName method is not valid in getRoleByNameInternal.");
  }
  return db.getRoleByName(name);
}

export async function ensureDefaultRolesExistInternal(): Promise<{ success: boolean; message: string; rolesProcessed?: number }> {
  const db = await getDatabaseAdapter();
   console.log(`[ensureDefaultRolesExistInternal] Adapter received. Type: ${db?.constructor?.name}. Method ensureDefaultRolesExist is function: ${typeof (db as any)?.ensureDefaultRolesExist === 'function'}`);
   if (!db || typeof db.ensureDefaultRolesExist !== 'function') {
    console.error("[ensureDefaultRolesExistInternal] CRITICAL: db adapter or db.ensureDefaultRolesExist is not valid.");
    throw new Error("Database adapter or ensureDefaultRolesExist method is not valid in ensureDefaultRolesExistInternal.");
  }
  return db.ensureDefaultRolesExist();
}
