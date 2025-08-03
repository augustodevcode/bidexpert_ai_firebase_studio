
// src/app/admin/states/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { StateService } from '@/services/state.service';
import type { StateInfo, StateFormData } from '@/types';

const stateService = new StateService();

export async function getStates(): Promise<StateInfo[]> {
  return stateService.getStates();
}

export async function getState(id: string): Promise<StateInfo | null> {
  return stateService.getStateById(id);
}

export async function createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string }> {
  const result = await stateService.createState(data);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/states');
  }
  return result;
}

export async function updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string }> {
  const result = await stateService.updateState(id, data);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/states');
    revalidatePath(`/admin/states/${id}/edit`);
  }
  return result;
}

export async function deleteState(id: string): Promise<{ success: boolean; message: string }> {
  const result = await stateService.deleteState(id);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/states');
  }
  return result;
}
