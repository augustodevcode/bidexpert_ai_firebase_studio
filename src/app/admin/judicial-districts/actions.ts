// src/app/admin/judicial-districts/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { JudicialDistrict, JudicialDistrictFormData } from '@/types';
import { JudicialDistrictService } from '@/services/judicial-district.service';

const districtService = new JudicialDistrictService();

export async function getJudicialDistricts(): Promise<JudicialDistrict[]> {
    return districtService.getJudicialDistricts();
}

export async function getJudicialDistrict(id: string): Promise<JudicialDistrict | null> {
    return districtService.getJudicialDistrictById(id);
}

export async function createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }> {
    const result = await districtService.createJudicialDistrict(data);
    if (result.success) {
        revalidatePath('/admin/judicial-districts');
    }
    return result;
}

export async function updateJudicialDistrict(id: string, data: Partial<JudicialDistrictFormData>): Promise<{ success: boolean; message: string; }> {
    const result = await districtService.updateJudicialDistrict(id, data);
    if (result.success) {
        revalidatePath('/admin/judicial-districts');
        revalidatePath(`/admin/judicial-districts/${id}/edit`);
    }
    return result;
}

export async function deleteJudicialDistrict(id: string): Promise<{ success: boolean; message: string; }> {
    const result = await districtService.deleteJudicialDistrict(id);
    if (result.success) {
        revalidatePath('/admin/judicial-districts');
    }
    return result;
}
