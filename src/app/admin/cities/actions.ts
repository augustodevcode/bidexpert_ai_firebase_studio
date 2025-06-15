
// src/app/admin/cities/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { sampleCities, sampleStates } from '@/lib/sample-data';
import type { CityInfo, CityFormData } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function createCity(
  data: CityFormData
): Promise<{ success: boolean; message: string; cityId?: string }> {
  console.log(`[Action - createCity - SampleData Mode] Simulating creation for: ${data.name}`);
  await delay(100);
  revalidatePath('/admin/cities');
  revalidatePath('/admin/states'); 
  return { success: true, message: `Cidade "${data.name}" (simulada) criada!`, cityId: `sample-city-${Date.now()}` };
}

export async function getCities(stateIdFilter?: string): Promise<CityInfo[]> {
  console.log(`[Action - getCities - SampleData Mode] Fetching from sample-data.ts. Filter: ${stateIdFilter}`);
  await delay(50);
  if (stateIdFilter) {
    // O stateIdFilter pode ser o ID numérico do estado ou o slug
    const state = sampleStates.find(s => String(s.id) === stateIdFilter || s.slug === stateIdFilter);
    if (state) {
      return Promise.resolve(JSON.parse(JSON.stringify(sampleCities.filter(city => city.stateId === state.id))));
    }
    return Promise.resolve([]);
  }
  return Promise.resolve(JSON.parse(JSON.stringify(sampleCities)));
}

export async function getCity(id: string): Promise<CityInfo | null> {
  console.log(`[Action - getCity - SampleData Mode] Fetching city ID: ${id} from sample-data.ts`);
  await delay(50);
  // O ID pode ser o ID numérico ou o formato slug-composto "stateSlug-citySlug"
  const city = sampleCities.find(c => String(c.id) === id || `${c.stateId}-${c.slug}` === id);
  return Promise.resolve(city ? JSON.parse(JSON.stringify(city)) : null);
}

export async function updateCity(
  id: string,
  data: Partial<CityFormData>
): Promise<{ success: boolean; message: string }> {
  console.log(`[Action - updateCity - SampleData Mode] Simulating update for city ID: ${id} with data:`, data);
  await delay(100);
  revalidatePath('/admin/cities');
  revalidatePath(`/admin/cities/${id}/edit`);
  return { success: true, message: `Cidade (simulada) atualizada!` };
}

export async function deleteCity(
  id: string
): Promise<{ success: boolean; message: string }> {
  console.log(`[Action - deleteCity - SampleData Mode] Simulating deletion for city ID: ${id}`);
  await delay(100);
  revalidatePath('/admin/cities');
  return { success: true, message: `Cidade (simulada) excluída!` };
}

    