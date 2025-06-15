
// src/app/admin/categories/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { sampleLotCategories, slugify } from '@/lib/sample-data';
import type { LotCategory } from '@/types';

// Simula uma pequena latência de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function createLotCategory(
  data: { name: string; description?: string; }
): Promise<{ success: boolean; message: string; categoryId?: string; }> {
  // Usar concatenação de string simples
  console.log('[Action - createLotCategory - SampleData Mode] Simulating creation for: ' + data.name);
  await delay(100); 
  // Não modifica o array `sampleLotCategories` em `sample-data.ts` pois é estático.
  // Apenas simula sucesso.
  revalidatePath('/admin/categories');
  return { success: true, message: `Categoria "${data.name}" (simulada) criada com sucesso!`, categoryId: `sample-cat-${Date.now()}` };
}

export async function getLotCategories(): Promise<LotCategory[]> {
  console.log('[Action - getLotCategories - SampleData Mode] Fetching from sampleLotCategories in sample-data.ts');
  await delay(50);
  return Promise.resolve(JSON.parse(JSON.stringify(sampleLotCategories))); // Retorna cópia para evitar mutação acidental
}

export async function getLotCategory(id: string): Promise<LotCategory | null> {
  console.log('[Action - getLotCategory - SampleData Mode] Fetching category ID: ' + id + ' from sampleLotCategories');
  await delay(50);
  const category = sampleLotCategories.find(cat => cat.id === id || cat.slug === id);
  return Promise.resolve(category ? JSON.parse(JSON.stringify(category)) : null);
}

export async function getLotCategoryBySlug(slug: string): Promise<LotCategory | null> {
  console.log('[Action - getLotCategoryBySlug - SampleData Mode] Fetching category slug: ' + slug + ' from sampleLotCategories');
  await delay(50);
  const category = sampleLotCategories.find(cat => cat.slug === slug);
  return Promise.resolve(category ? JSON.parse(JSON.stringify(category)) : null);
}

export async function getLotCategoryByName(name: string): Promise<LotCategory | null> {
  console.log('[Action - getLotCategoryByName - SampleData Mode] Fetching category name: ' + name + ' from sampleLotCategories');
  await delay(50);
  const normalizedName = name.trim().toLowerCase();
  const category = sampleLotCategories.find(cat => cat.name.toLowerCase() === normalizedName);
  return Promise.resolve(category ? JSON.parse(JSON.stringify(category)) : null);
}

export async function updateLotCategory(
  id: string,
  data: { name: string; description?: string; }
): Promise<{ success: boolean; message: string; }> {
  console.log('[Action - updateLotCategory - SampleData Mode] Simulating update for category ID: ' + id + ' with data: ' + JSON.stringify(data));
  await delay(100);
  revalidatePath('/admin/categories');
  revalidatePath(`/admin/categories/${id}/edit`);
  return { success: true, message: `Categoria "${data.name}" (simulada) atualizada com sucesso!` };
}

export async function deleteLotCategory(
  id: string
): Promise<{ success: boolean; message: string; }> {
  console.log('[Action - deleteLotCategory - SampleData Mode] Simulating deletion for category ID: ' + id);
  await delay(100);
  revalidatePath('/admin/categories');
  return { success: true, message: `Categoria com ID "${id}" (simulada) excluída com sucesso!` };
}
