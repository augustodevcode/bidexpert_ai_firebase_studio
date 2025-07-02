// src/app/admin/judicial-districts/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { JudicialDistrict, JudicialDistrictFormData } from '@/types';

export async function createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.createJudicialDistrict(data);
  if (result.success) {
    revalidatePath('/admin/judicial-districts');
  }
  return result;
}

export async function getJudicialDistricts(): Promise<JudicialDistrict[]> {
  const db = await getDatabaseAdapter();
  return db.getJudicialDistricts();
}

export async function getJudicialDistrict(id: string): Promise<JudicialDistrict | null> {
  const db = await getDatabaseAdapter();
  return db.getJudicialDistrict(id);
}

export async function updateJudicialDistrict(id: string, data: Partial<JudicialDistrictFormData>): Promise<{ success: boolean; message: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.updateJudicialDistrict(id, data);
  if (result.success) {
    revalidatePath('/admin/judicial-districts');
    revalidatePath(`/admin/judicial-districts/${id}/edit`);
  }
  return result;
}

export async function deleteJudicialDistrict(id: string): Promise<{ success: boolean; message: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.deleteJudicialDistrict(id);
  if (result.success) {
    revalidatePath('/admin/judicial-districts');
  }
  return result;
}
