// src/app/admin/states/actions.ts
/**
 * @fileoverview Server Actions para a entidade State (Estado).
 * Este arquivo define as funções que o cliente pode chamar para interagir com
 * os dados dos estados no servidor. Atua como a camada de Controller que interage
 * com o StateService, aplicando a lógica de negócio e gerenciando a revalidação
 * do cache quando os dados são modificados.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { StateService } from '@/services/state.service';
import type { StateInfo, StateFormData } from '@/types';
import { sanitizeResponse } from '@/lib/serialization-helper';

const stateService = new StateService();

export async function getStates(): Promise<StateInfo[]> {
  const result = await stateService.getStates();
  return sanitizeResponse(result);
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
