
// src/app/admin/bens/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { Bem, BemFormData } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
  try {
    const newBem = await prisma.bem.create({
      data: {
        ...data,
        publicId: `BEM-PUB-${uuidv4().substring(0, 8)}`,
      } as any, // Using any to bypass Prisma's strict type checking for JSON fields until fully typed
    });
    revalidatePath('/admin/bens');
    revalidatePath('/admin/wizard');
    revalidatePath('/admin/lots/new');
    return { success: true, message: 'Bem criado com sucesso!', bemId: newBem.id };
  } catch (error: any) {
    console.error("Error creating Bem:", error);
    return { success: false, message: error.message || 'Falha ao criar o bem.' };
  }
}

export async function getBens(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Bem[]> {
  try {
    const bens = await prisma.bem.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        subcategory: true,
        judicialProcess: true,
        seller: true,
      }
    });
    return bens.map(b => ({
      ...b,
      categoryName: b.category?.name,
      subcategoryName: b.subcategory?.name,
      judicialProcessNumber: b.judicialProcess?.processNumber,
      sellerName: b.seller?.name,
    })) as unknown as Bem[];
  } catch (error) {
    console.error("Error fetching Bens:", error);
    return [];
  }
}

export async function getBensByIds(ids: string[]): Promise<Bem[]> {
  if (!ids || ids.length === 0) return [];
  try {
    const bens = await prisma.bem.findMany({
      where: { id: { in: ids } },
      include: { category: true, subcategory: true }
    });
    return bens.map(b => ({ ...b, categoryName: b.category?.name, subcategoryName: b.subcategory?.name })) as unknown as Bem[];
  } catch (error) {
    console.error("Error fetching Bens by IDs:", error);
    return [];
  }
}

export async function getBem(id: string): Promise<Bem | null> {
  try {
    const bem = await prisma.bem.findUnique({
      where: { id },
      include: { category: true, subcategory: true, judicialProcess: true, seller: true },
    });
    if (!bem) return null;
    return { 
      ...bem, 
      categoryName: bem.category?.name, 
      subcategoryName: bem.subcategory?.name,
      judicialProcessNumber: bem.judicialProcess?.processNumber,
      sellerName: bem.seller?.name,
    } as unknown as Bem;
  } catch (error) {
    console.error(`Error fetching Bem with ID ${id}:`, error);
    return null;
  }
}

export async function updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
  try {
    await prisma.bem.update({
      where: { id },
      data: data as any,
    });
    revalidatePath('/admin/bens');
    revalidatePath(`/admin/bens/${id}/edit`);
    revalidatePath('/admin/wizard');
    revalidatePath('/admin/lots');
    return { success: true, message: 'Bem atualizado com sucesso!' };
  } catch (error: any) {
    console.error(`Error updating Bem with ID ${id}:`, error);
    return { success: false, message: error.message || 'Falha ao atualizar o bem.' };
  }
}

export async function deleteBem(id: string): Promise<{ success: boolean; message: string; }> {
  try {
    await prisma.bem.delete({ where: { id } });
    revalidatePath('/admin/bens');
    revalidatePath('/admin/wizard');
    revalidatePath('/admin/lots');
    return { success: true, message: 'Bem excluído com sucesso!' };
  } catch (error: any) {
    console.error(`Error deleting Bem with ID ${id}:`, error);
    if (error.code === 'P2003') {
      return { success: false, message: 'Não é possível excluir. Este bem está vinculado a um lote.' };
    }
    return { success: false, message: error.message || 'Falha ao excluir o bem.' };
  }
}
