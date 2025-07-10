// src/app/admin/courts/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database/index';
import type { Court, CourtFormData } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getCourts(): Promise<Court[]> {
  const db = await getDatabaseAdapter();
  // @ts-ignore - Assuming this method exists on the adapter for now
  if (db.getCourts) {
    // @ts-ignore
    return db.getCourts();
  }
  return []; // Return empty if not implemented
}

export async function getCourt(id: string): Promise<Court | null> {
    const courts = await getCourts();
    return courts.find(c => c.id === id) || null;
}

export async function createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> {
    console.warn("createCourt with sample data adapter is not fully implemented.");
    return { success: false, message: "Criação de tribunal não implementada para este adaptador." };
}

export async function updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> {
     console.warn("updateCourt with sample data adapter is not fully implemented.");
    return { success: false, message: "Atualização de tribunal não implementada para este adaptador." };
}

export async function deleteCourt(id: string): Promise<{ success: boolean; message: string; }> {
     console.warn("deleteCourt with sample data adapter is not fully implemented.");
    return { success: false, message: "Exclusão de tribunal não implementada para este adaptador." };
}
