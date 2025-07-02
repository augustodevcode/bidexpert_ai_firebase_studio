// src/app/admin/judicial-processes/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { JudicialProcess, JudicialProcessFormData } from '@/types';

export async function createJudicialProcessAction(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.createJudicialProcess(data);
  if (result.success) {
    revalidatePath('/admin/judicial-processes');
  }
  return result;
}

export async function getJudicialProcesses(): Promise<JudicialProcess[]> {
  const db = await getDatabaseAdapter();
  return db.getJudicialProcesses();
}

export async function getJudicialProcess(id: string): Promise<JudicialProcess | null> {
  const db = await getDatabaseAdapter();
  return db.getJudicialProcess(id);
}

export async function updateJudicialProcessAction(id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.updateJudicialProcess(id, data);
  if (result.success) {
    revalidatePath('/admin/judicial-processes');
    revalidatePath(`/admin/judicial-processes/${id}/edit`);
  }
  return result;
}

export async function deleteJudicialProcess(id: string): Promise<{ success: boolean; message: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.deleteJudicialProcess(id);
  if (result.success) {
    revalidatePath('/admin/judicial-processes');
  }
  return result;
}
