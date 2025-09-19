// src/app/admin/bens/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { Bem, BemFormData } from '@/types';
import { BemService } from '@/services/bem.service';
import { getSession } from '@/app/auth/actions';

const bemService = new BemService();

async function getTenantId() {
    const session = await getSession();
    if (!session?.tenantId) {
        throw new Error("Tenant ID não encontrado.");
    }
    return session.tenantId;
}

export async function getBens(filter?: { judicialProcessId?: string, sellerId?: string, tenantId?: string }): Promise<Bem[]> {
    const tenantId = await getTenantId();
    return bemService.getBens({ ...filter, tenantId });
}

export async function getBem(id: string): Promise<Bem | null> {
    return bemService.getBemById(id);
}

export async function createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
    const tenantId = await getTenantId();
    const result = await bemService.createBem(tenantId, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/bens');
    }
    return result;
}

export async function updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
    const result = await bemService.updateBem(id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/bens');
        revalidatePath(`/admin/bens/${id}/edit`);
    }
    return result;
}

export async function deleteBem(id: string): Promise<{ success: boolean; message: string; }> {
    const result = await bemService.deleteBem(id);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/bens');
    }
    return result;
}

export async function getBensByIdsAction(ids: string[]): Promise<Bem[]> {
    return bemService.getBensByIds(ids);
}
