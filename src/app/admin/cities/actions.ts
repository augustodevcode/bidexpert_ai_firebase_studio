// src/app/admin/cities/actions.ts
/**
 * @fileoverview Server Actions para a entidade City (Cidade).
 * Este arquivo exporta funções que lidam com a criação, leitura, atualização
 * e exclusão (CRUD) de cidades. As ações interagem com a CityService para
 * aplicar a lógica de negócio e persistir os dados, além de revalidar
 * o cache do Next.js quando necessário.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { CityInfo, CityFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import { CityService } from '@/services/city.service';

const cityService = new CityService();

export async function getCities(stateIdFilter?: string): Promise<CityInfo[]> {
    return cityService.getCities(stateIdFilter);
}

export async function getCity(id: string): Promise<CityInfo | null> {
    return cityService.getCityById(id);
}

export async function createCity(data: CityFormData): Promise<{ success: boolean, message: string, cityId?: string }> {
    const result = await cityService.createCity(data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/cities');
    }
    return result;
}

export async function updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean, message: string }> {
     const result = await cityService.updateCity(id, data);
     if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/cities');
        revalidatePath(`/admin/cities/${id}/edit`);
    }
    return result;
}

export async function deleteCity(id: string): Promise<{ success: boolean, message: string }> {
    const result = await cityService.deleteCity(id);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/cities');
    }
    return result;
}
