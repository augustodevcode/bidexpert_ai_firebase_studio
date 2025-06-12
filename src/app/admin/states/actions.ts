
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { StateInfo, StateFormData } from '@/types';

export async function createState(
  data: StateFormData
): Promise<{ success: boolean; message: string; stateId?: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.createState(data);
  if (result.success) {
    revalidatePath('/admin/states');
  }
  return result;
}

export async function getStates(): Promise<StateInfo[]> {
  const db = await getDatabaseAdapter();
  return db.getStates();
}

export async function getState(id: string): Promise<StateInfo | null> {
  const db = await getDatabaseAdapter();
  return db.getState(id);
}

export async function updateState(
  id: string,
  data: Partial<StateFormData>
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.updateState(id, data);
  if (result.success) {
    revalidatePath('/admin/states');
    revalidatePath(`/admin/states/${id}/edit`);
  }
  return result;
}

export async function deleteState(
  id: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.deleteState(id);
  if (result.success) {
    revalidatePath('/admin/states');
  }
  return result;
}
