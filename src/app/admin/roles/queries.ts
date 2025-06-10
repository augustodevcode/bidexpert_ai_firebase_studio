
// src/app/admin/roles/queries.ts
// Este arquivo NÃO deve ter 'use server'; pois contém lógica de DB pura
// e será importado por Server Actions e Server Components.

import { getDatabaseAdapter } from '@/lib/database';
import type { Role } from '@/types';
import { predefinedPermissions } from './role-form-schema'; // Continua aqui para lógica de validação interna se necessário

// Renomeado para indicar que é uma função interna de busca
export async function getRolesInternal(): Promise<Role[]> {
  const db = getDatabaseAdapter();
  return db.getRoles();
}

export async function getRoleInternal(id: string): Promise<Role | null> {
  const db = getDatabaseAdapter();
  return db.getRole(id);
}

export async function getRoleByNameInternal(name: string): Promise<Role | null> {
  const db = getDatabaseAdapter();
  return db.getRoleByName(name);
}

// A lógica de ensureDefaultRolesExist é uma mutação e deve ficar em actions.ts ou ser chamada por uma action.
// Por enquanto, vamos manter as dependências do DB aqui e a action chamará.
export async function ensureDefaultRolesExistInternal(): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  return db.ensureDefaultRolesExist();
}
