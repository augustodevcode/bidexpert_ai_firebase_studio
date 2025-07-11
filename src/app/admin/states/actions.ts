// src/app/admin/states/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { StateInfo, StateFormData } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getStates(): Promise<StateInfo[]> {
  const db = await getDatabaseAdapter();
  // @ts-ignore
  return db.getStates ? db.getStates() : [];
}

export async function getState(id: string): Promise<StateInfo | null> {
  const states = await getStates();
  return states.find(s => s.id === id) || null;
}

export async function createState(
  data: StateFormData
): Promise<{ success: boolean; message: string; stateId?: string }> {
  const db = await getDatabaseAdapter();
  // @ts-ignore
  if (!db.createState) {
    return { success: false, message: "Criação de estado não implementada." };
  }
  // @ts-ignore
  const result = await db.createState(data);
  if (result.success) {
    revalidatePath('/admin/states');
  }
  return result;
}

export async function updateState(
  id: string,
  data: Partial<StateFormData>
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  // @ts-ignore
  if (!db.updateState) {
    return { success: false, message: "Atualização de estado não implementada." };
  }
  // @ts-ignore
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
  // @ts-ignore
  if (!db.deleteState) {
    return { success: false, message: "Exclusão de estado não implementada." };
  }
  // @ts-ignore
  const result = await db.deleteState(id);
  if (result.success) {
    revalidatePath('/admin/states');
  }
  return result;
}
