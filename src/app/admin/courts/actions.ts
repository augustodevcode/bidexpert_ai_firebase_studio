// src/app/admin/courts/actions.ts
/**
 * @fileoverview Server Actions para a entidade Court (Tribunal).
 * Este arquivo exporta as funções que o cliente pode chamar para interagir
 * com os dados dos tribunais no servidor. Ele atua como a camada de Controller,
 * recebendo as requisições, chamando o CourtService para aplicar a lógica de negócio
 * e persistir os dados, e lidando com a revalidação de cache do Next.js.
 */
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
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/courts');
    }
    return result;
}

export async function updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> {
    const result = await courtService.updateCourt(id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/courts');
        revalidatePath(`/admin/courts/${id}/edit`);
    }
    return result;
}

export async function deleteCourt(id: string): Promise<{ success: boolean; message: string; }> {
    const result = await courtService.deleteCourt(id);
     if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/courts');
    }
    return result;
}
