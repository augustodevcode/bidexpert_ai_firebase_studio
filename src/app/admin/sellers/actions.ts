// src/app/admin/sellers/actions.ts
'use server';

import type { SellerProfileInfo, SellerFormData, Lot } from '@/types';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function getSellers(): Promise<SellerProfileInfo[]> {
    return prisma.seller.findMany({ orderBy: { name: 'asc' }});
}

export async function getSeller(id: string): Promise<SellerProfileInfo | null> {
    return prisma.seller.findFirst({ where: { OR: [{ id }, { publicId: id }] }});
}

export async function getSellerBySlug(slugOrId: string): Promise<SellerProfileInfo | null> {
    return prisma.seller.findFirst({
        where: {
            OR: [{ slug: slugOrId }, { id: slugOrId }, { publicId: slugOrId }]
        }
    });
}

export async function getLotsBySellerSlug(sellerSlugOrId: string): Promise<Lot[]> {
  const seller = await getSellerBySlug(sellerSlugOrId);
  if (!seller) return [];

  return prisma.lot.findMany({
    where: { sellerId: seller.id }
  });
}


export async function createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
    try {
        const result = await prisma.seller.create({ data });
        revalidatePath('/admin/sellers');
        return { success: true, message: 'Comitente criado com sucesso.', sellerId: result.id };
    } catch (error: any) {
        return { success: false, message: `Falha ao criar comitente: ${error.message}` };
    }
}

export async function updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
    try {
        await prisma.seller.update({ where: { id }, data });
        revalidatePath('/admin/sellers');
        revalidatePath(`/admin/sellers/${id}/edit`);
        return { success: true, message: "Comitente atualizado com sucesso." };
    } catch (error: any) {
        return { success: false, message: `Falha ao atualizar comitente: ${error.message}` };
    }
}

export async function deleteSeller(id: string): Promise<{ success: boolean; message: string; }> {
    try {
        // In a real app, check for linked auctions/lots first
        await prisma.seller.delete({ where: { id } });
        revalidatePath('/admin/sellers');
        return { success: true, message: "Comitente excluído com sucesso." };
    } catch (error: any) {
        return { success: false, message: `Falha ao excluir comitente: ${error.message}` };
    }
}
