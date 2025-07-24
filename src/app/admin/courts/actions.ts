// src/app/admin/courts/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { Court, CourtFormData } from '@/types';
import { CourtService } from '@/services/court.service';

const courtService = new CourtService();

export async function getCourts(): Promise<Court[]> {
  return courtService.getCourts();
}

export async function getCourt(id: string): Promise<Court | null> {
    return courtService.getCourtById(id);
}

export async function createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> {
    const result = await courtService.createCourt(data);
    if (result.success) {
        revalidatePath('/admin/courts');
    }
    return result;
}

export async function updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> {
    const result = await courtService.updateCourt(id, data);
    if (result.success) {
        revalidatePath('/admin/courts');
        revalidatePath(`/admin/courts/${id}/edit`);
    }
    return result;
}

export async function deleteCourt(id: string): Promise<{ success: boolean; message: string; }> {
    const result = await courtService.deleteCourt(id);
     if (result.success) {
        revalidatePath('/admin/courts');
    }
    return result;
}
