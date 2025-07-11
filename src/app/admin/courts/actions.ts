// src/app/admin/courts/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { Court, CourtFormData } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getCourts(): Promise<Court[]> {
  const db = getDatabaseAdapter();
  return db.getCourts();
}

export async function getCourt(id: string): Promise<Court | null> {
    const db = getDatabaseAdapter();
    const courts = await db.getCourts();
    return courts.find(c => c.id === id) || null;
}

export async function createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> {
    const db = getDatabaseAdapter();
    // @ts-ignore
    const result = await db.createCourt(data);
    if (result.success) {
        revalidatePath('/admin/courts');
    }
    return result;
}

export async function updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> {
     const db = getDatabaseAdapter();
    // @ts-ignore
    const result = await db.updateCourt(id, data);
    if (result.success) {
        revalidatePath('/admin/courts');
        revalidatePath(`/admin/courts/${id}/edit`);
    }
    return result;
}

export async function deleteCourt(id: string): Promise<{ success: boolean; message: string; }> {
    const db = getDatabaseAdapter();
    // Em um app real, verificar se o tribunal tem comarcas vinculadas
    // @ts-ignore
    const result = await db.deleteCourt(id);
    if (result.success) {
        revalidatePath('/admin/courts');
    }
    return result;
}
