// src/app/admin/states/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { StateInfo, StateFormData } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getStates(): Promise<StateInfo[]> {
  const db = await getDatabaseAdapter();
  // @ts-ignore - Assuming this method exists on the adapter
  return db.getStates ? db.getStates() : [];
}

export async function getState(id: string): Promise<StateInfo | null> {
  const states = await getStates();
  return states.find(s => s.id === id) || null;
}

export async function createState(
  data: StateFormData
): Promise<{ success: boolean; message: string; stateId?: string }> {
  console.warn("createState with this adapter is not implemented.");
  return { success: false, message: "Criação de estado não implementada." };
}

export async function updateState(
  id: string,
  data: Partial<StateFormData>
): Promise<{ success: boolean; message: string }> {
  console.warn("updateState with this adapter is not implemented.");
  return { success: false, message: "Atualização de estado não implementada." };
}

export async function deleteState(
  id: string
): Promise<{ success: boolean; message: string }> {
  console.warn("deleteState with this adapter is not implemented.");
  return { success: false, message: "Exclusão de estado não implementada." };
}
