// src/app/admin/cities/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { CityInfo, CityFormData, StateInfo } from '@/types';
import { revalidatePath } from 'next/cache';


export async function getCities(stateIdFilter?: string): Promise<CityInfo[]> {
    const db = getDatabaseAdapter();
    return db.getCities(stateIdFilter);
}

export async function getCity(id: string): Promise<CityInfo | null> {
    const cities = await getCities();
    return cities.find(c => c.id === id) || null;
}

export async function createCity(data: CityFormData): Promise<{ success: boolean, message: string, cityId?: string }> {
    const db = getDatabaseAdapter();
    const result = await db.createCity(data);
    if (result.success) {
      revalidatePath('/admin/cities');
    }
    return result;
}

export async function updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean, message: string }> {
    const db = getDatabaseAdapter();
    const result = await db.updateCity(id, data);
    if (result.success) {
        revalidatePath('/admin/cities');
        revalidatePath(`/admin/cities/${id}/edit`);
    }
    return result;
}

export async function deleteCity(id: string): Promise<{ success: boolean, message: string }> {
    const db = getDatabaseAdapter();
    const result = await db.deleteCity(id);
    if (result.success) {
        revalidatePath('/admin/cities');
    }
    return result;
}
