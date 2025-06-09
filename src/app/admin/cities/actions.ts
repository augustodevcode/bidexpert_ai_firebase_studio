
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { CityInfo, CityFormData } from '@/types';

export async function createCity(
  data: CityFormData
): Promise<{ success: boolean; message: string; cityId?: string }> {
  const db = getDatabaseAdapter();
  const result = await db.createCity(data);
  if (result.success) {
    revalidatePath('/admin/cities');
    revalidatePath('/admin/states'); // Also revalidate states as cityCount might change
  }
  return result;
}

export async function getCities(stateIdFilter?: string): Promise<CityInfo[]> {
  const db = getDatabaseAdapter();
  return db.getCities(stateIdFilter);
}

export async function getCity(id: string): Promise<CityInfo | null> {
  const db = getDatabaseAdapter();
  return db.getCity(id);
}

export async function updateCity(
  id: string,
  data: Partial<CityFormData>
): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  const result = await db.updateCity(id, data);
  if (result.success) {
    revalidatePath('/admin/cities');
    revalidatePath(`/admin/cities/${id}/edit`);
  }
  return result;
}

export async function deleteCity(
  id: string
): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  const result = await db.deleteCity(id);
  if (result.success) {
    revalidatePath('/admin/cities');
  }
  return result;
}
