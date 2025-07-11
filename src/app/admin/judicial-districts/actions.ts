// src/app/admin/judicial-districts/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { JudicialDistrict, JudicialDistrictFormData } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getJudicialDistricts(): Promise<JudicialDistrict[]> {
    const db = await getDatabaseAdapter();
    return db.getJudicialDistricts();
}

export async function getJudicialDistrict(id: string): Promise<JudicialDistrict | null> {
    const db = getDatabaseAdapter();
    const districts = await db.getJudicialDistricts();
    return districts.find(d => d.id === id) || null;
}

export async function createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }> {
    const db = getDatabaseAdapter();
    // @ts-ignore
    const result = await db.createJudicialDistrict(data);
    if(result.success) {
      revalidatePath('/admin/judicial-districts');
    }
    return result;
}

export async function updateJudicialDistrict(id: string, data: Partial<JudicialDistrictFormData>): Promise<{ success: boolean; message: string; }> {
    const db = getDatabaseAdapter();
    // @ts-ignore
    const result = await db.updateJudicialDistrict(id, data);
    if(result.success) {
      revalidatePath('/admin/judicial-districts');
      revalidatePath(`/admin/judicial-districts/${id}/edit`);
    }
    return result;
}

export async function deleteJudicialDistrict(id: string): Promise<{ success: boolean; message: string; }> {
    const db = getDatabaseAdapter();
    // @ts-ignore
    const result = await db.deleteJudicialDistrict(id);
    if (result.success) {
        revalidatePath('/admin/judicial-districts');
    }
    return result;
}
