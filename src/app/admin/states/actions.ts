
// src/app/admin/states/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { sampleStates } from '@/lib/sample-data';
import type { StateInfo, StateFormData } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function createState(
  data: StateFormData
): Promise<{ success: boolean; message: string; stateId?: string }> {
  console.log(`[Action - createState - SampleData Mode] Simulating creation for: ${data.name}`);
  await delay(100);
  revalidatePath('/admin/states');
  return { success: true, message: `Estado "${data.name}" (simulado) criado!`, stateId: `sample-state-${Date.now()}` };
}

export async function getStates(): Promise<StateInfo[]> {
  console.log('[Action - getStates - SampleData Mode] Fetching from sample-data.ts');
  await delay(50);
  return Promise.resolve(JSON.parse(JSON.stringify(sampleStates)));
}

export async function getState(id: string): Promise<StateInfo | null> {
  console.log(`[Action - getState - SampleData Mode] Fetching state ID/slug: ${id} from sample-data.ts`);
  await delay(50);
  const state = sampleStates.find(s => s.id === id || s.slug === id || s.uf === id.toUpperCase());
  return Promise.resolve(state ? JSON.parse(JSON.stringify(state)) : null);
}

export async function updateState(
  id: string,
  data: Partial<StateFormData>
): Promise<{ success: boolean; message: string }> {
  console.log(`[Action - updateState - SampleData Mode] Simulating update for state ID: ${id} with data:`, data);
  await delay(100);
  revalidatePath('/admin/states');
  revalidatePath(`/admin/states/${id}/edit`);
  return { success: true, message: `Estado (simulado) atualizado!` };
}

export async function deleteState(
  id: string
): Promise<{ success: boolean; message: string }> {
  console.log(`[Action - deleteState - SampleData Mode] Simulating deletion for state ID: ${id}`);
  await delay(100);
  revalidatePath('/admin/states');
  return { success: true, message: `Estado (simulado) excluído!` };
}
    