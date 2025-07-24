// src/app/admin/bens/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { Bem, BemFormData } from '@/types';
import { BemService } from '@/services/bem.service';

const bemService = new BemService();

export async function getBens(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Bem[]> {
    return bemService.getBens(filter);
}

export async function getBem(id: string): Promise<Bem | null> {
    return bemService.getBemById(id);
}

export async function createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
    const result = await bemService.createBem(data);
    if (result.success) {
        revalidatePath('/admin/bens');
    }
    return result;
}

export async function updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
    const result = await bemService.updateBem(id, data);
    if (result.success) {
        revalidatePath('/admin/bens');
        revalidatePath(`/admin/bens/${id}/edit`);
    }
    return result;
}

export async function deleteBem(id: string): Promise<{ success: boolean; message: string; }> {
    const result = await bemService.deleteBem(id);
    if (result.success) {
        revalidatePath('/admin/bens');
    }
    return result;
}

export async function getBensByIdsAction(ids: string[]): Promise<Bem[]> {
    return bemService.getBensByIds(ids);
}
