// src/app/admin/cities/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { CityInfo, CityFormData } from '@/types';
import { revalidatePath } from 'next/cache';


export async function getCities(stateIdFilter?: string): Promise<CityInfo[]> {
    const db = await getDatabaseAdapter();
    // @ts-ignore
    if(db.getCities) {
      // @ts-ignore
      return db.getCities(stateIdFilter);
    }
    return [];
}

export async function getCity(id: string): Promise<CityInfo | null> {
    const cities = await getCities();
    return cities.find(c => c.id === id) || null;
}

export async function createCity(data: CityFormData): Promise<{ success: boolean, message: string, cityId?: string }> {
    console.warn("createCity with sample data adapter is not fully implemented.");
    return { success: false, message: "Criação de cidade não implementada." };
}

export async function updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean, message: string }> {
    console.warn("updateCity with sample data adapter is not fully implemented.");
    return { success: false, message: "Atualização de cidade não implementada." };
}

export async function deleteCity(id: string): Promise<{ success: boolean, message: string }> {
    console.warn("deleteCity with sample data adapter is not fully implemented.");
    return { success: false, message: "Exclusão de cidade não implementada." };
}
