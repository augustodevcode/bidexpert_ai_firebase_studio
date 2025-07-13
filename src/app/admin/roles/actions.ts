// src/app/admin/roles/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database/index';
import type { Role } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getRoles(): Promise<Role[]> {
    const db = await getDatabaseAdapter();
    return db.getRoles();
}

export async function getRole(id: string): Promise<Role | null> {
    const db = await getDatabaseAdapter();
    const roles = await db.getRoles();
    return roles.find(r => r.id === id) || null;
}
// Outras actions como create, update, delete precisariam ser implementadas
// de forma similar, chamando os métodos correspondentes no adaptador.

export async function createRole(data: Partial<Role>): Promise<{ success: boolean; message: string; roleId?: string }> {
    'use server';
    const db = await getDatabaseAdapter();
    // Placeholder implementation - assuming db.createRole exists
    // @ts-ignore 
    const result = await db.createRole(data);
    if (result.success) {
        revalidatePath('/admin/roles');
    }
    return result;
}

export async function updateRole(id: string, data: Partial<Role>): Promise<{ success: boolean; message: string }> {
    'use server';
    const db = await getDatabaseAdapter();
    // Placeholder implementation - assuming db.updateRole exists
    // @ts-ignore
    const result = await db.updateRole(id, data);
    if (result.success) {
        revalidatePath('/admin/roles');
        revalidatePath(`/admin/roles/${id}/edit`);
    }
    return result;
}

export async function deleteRole(id: string): Promise<{ success: boolean; message: string }> {
    'use server';
    const db = await getDatabaseAdapter();
    // Placeholder implementation - assuming db.deleteRole exists
    // @ts-ignore
    const result = await db.deleteRole(id);
     if (result.success) {
        revalidatePath('/admin/roles');
    }
    return result;
}
// Outras actions como create, update, delete precisariam ser implementadas
// de forma similar, chamando os métodos correspondentes no adaptador.
