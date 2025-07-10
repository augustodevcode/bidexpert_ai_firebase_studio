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
