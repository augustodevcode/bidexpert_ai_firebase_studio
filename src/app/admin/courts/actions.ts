// src/app/admin/courts/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { Court, CourtFormData } from '@/types';

export async function createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.createCourt(data);
  if (result.success) {
    revalidatePath('/admin/courts');
  }
  return result;
}

export async function getCourts(): Promise<Court[]> {
  const db = await getDatabaseAdapter();
  return db.getCourts();
}

export async function getCourt(id: string): Promise<Court | null> {
  const db = await getDatabaseAdapter();
  return db.getCourt(id);
}

export async function updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.updateCourt(id, data);
  if (result.success) {
    revalidatePath('/admin/courts');
    revalidatePath(`/admin/courts/${id}/edit`);
  }
  return result;
}

export async function deleteCourt(id: string): Promise<{ success: boolean; message: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.deleteCourt(id);
  if (result.success) {
    revalidatePath('/admin/courts');
  }
  return result;
}
