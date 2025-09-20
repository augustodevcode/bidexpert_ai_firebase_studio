// src/app/admin/roles/actions.ts
/**
 * @fileoverview Server Actions para a entidade Role (Perfil de Usuário).
 * Este arquivo centraliza as operações de back-end para criar, ler, atualizar e
 * excluir perfis, atuando como a camada de controller que interage com a
 * RoleService para aplicar a lógica de negócio e as regras de permissão.
 */
'use server';

import { revalidatePath } from 'next/cache';
import type { Role, RoleFormData } from '@/types';
import { RoleService } from '@/services/role.service';

const roleService = new RoleService();

export async function getRoles(): Promise<Role[]> {
    return roleService.getRoles();
}

export async function getRole(id: string): Promise<Role | null> {
    return roleService.getRoleById(id);
}

export async function createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string }> {
    const result = await roleService.createRole(data);
    if (result.success && process.env.NODE_ENV !== 'test') {
      revalidatePath('/admin/roles');
    }
    return result;
}

export async function updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string }> {
    const result = await roleService.updateRole(id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/roles');
        revalidatePath(`/admin/roles/${id}/edit`);
    }
    return result;
}

export async function deleteRole(id: string): Promise<{ success: boolean; message: string; }> {
    const result = await roleService.deleteRole(id);
     if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/roles');
    }
    return result;
}
