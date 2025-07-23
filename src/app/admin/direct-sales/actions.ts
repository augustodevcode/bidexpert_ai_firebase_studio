// src/app/admin/direct-sales/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { DirectSaleOffer } from '@/types';
import { revalidatePath } from 'next/cache';

// Placeholder form data type
export type DirectSaleOfferFormData = Omit<DirectSaleOffer, 'id' | 'publicId' | 'createdAt' | 'updatedAt'>;

export async function getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    return prisma.directSaleOffer.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> {
    return prisma.directSaleOffer.findFirst({ where: { OR: [{ id }, { publicId: id }] } });
}

export async function createDirectSaleOffer(data: DirectSaleOfferFormData): Promise<{ success: boolean, message: string, offerId?: string }> {
  try {
    const newOffer = await prisma.directSaleOffer.create({ data: data as any });
    revalidatePath('/admin/direct-sales');
    return { success: true, message: "Oferta criada com sucesso.", offerId: newOffer.id };
  } catch (error: any) {
    return { success: false, message: `Falha ao criar oferta: ${error.message}` };
  }
}

export async function updateDirectSaleOffer(id: string, data: Partial<DirectSaleOfferFormData>): Promise<{ success: boolean, message: string }> {
  try {
    await prisma.directSaleOffer.update({ where: { id }, data: data as any });
    revalidatePath('/admin/direct-sales');
    revalidatePath(`/admin/direct-sales/${id}/edit`);
    return { success: true, message: "Oferta atualizada com sucesso." };
  } catch (error: any) {
    return { success: false, message: `Falha ao atualizar oferta: ${error.message}` };
  }
}

export async function deleteDirectSaleOffer(id: string): Promise<{ success: boolean, message: string }> {
  try {
    await prisma.directSaleOffer.delete({ where: { id } });
    revalidatePath('/admin/direct-sales');
    return { success: true, message: "Oferta excluída com sucesso." };
  } catch (error: any) {
    return { success: false, message: `Falha ao excluir oferta: ${error.message}` };
  }
}
