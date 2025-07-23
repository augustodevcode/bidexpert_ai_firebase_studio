// src/app/admin/courts/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { Court, CourtFormData } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getCourts(): Promise<Court[]> {
  return prisma.court.findMany({ orderBy: { name: 'asc' } });
}

export async function getCourt(id: string): Promise<Court | null> {
    return prisma.court.findUnique({ where: { id } });
}

export async function createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> {
    try {
        const newCourt = await prisma.court.create({ data: data as any });
        revalidatePath('/admin/courts');
        return { success: true, message: 'Tribunal criado com sucesso.', courtId: newCourt.id };
    } catch (error: any) {
        return { success: false, message: `Falha ao criar tribunal: ${error.message}` };
    }
}

export async function updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> {
    try {
        await prisma.court.update({ where: { id }, data: data as any });
        revalidatePath('/admin/courts');
        revalidatePath(`/admin/courts/${id}/edit`);
        return { success: true, message: 'Tribunal atualizado com sucesso.' };
    } catch (error: any) {
        return { success: false, message: `Falha ao atualizar tribunal: ${error.message}` };
    }
}

export async function deleteCourt(id: string): Promise<{ success: boolean; message: string; }> {
    try {
        // In a real app, check if the court has linked districts
        await prisma.court.delete({ where: { id } });
        revalidatePath('/admin/courts');
        return { success: true, message: 'Tribunal excluído com sucesso.' };
    } catch (error: any) {
        return { success: false, message: `Falha ao excluir tribunal: ${error.message}` };
    }
}
