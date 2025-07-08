'use server';

import { revalidatePath } from 'next/cache';
import type { AuctioneerProfileInfo, AuctioneerFormData, Auction } from '@/types';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';

export async function createAuctioneer(
  data: AuctioneerFormData
): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> {
  try {
    const newAuctioneer = await prisma.auctioneer.create({
      data: {
        ...data,
        publicId: `AUCT-PUB-${uuidv4().substring(0,8)}`,
        slug: slugify(data.name),
        userId: data.userId || null, // Ensure null if empty
      }
    });
    revalidatePath('/admin/auctioneers');
    return { success: true, message: 'Leiloeiro criado com sucesso!', auctioneerId: newAuctioneer.id, auctioneerPublicId: newAuctioneer.publicId };
  } catch (error: any) {
    console.error("Error creating auctioneer:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
      return { success: false, message: 'Já existe um leiloeiro com este nome (slug). Por favor, escolha outro nome.' };
    }
    return { success: false, message: error.message || 'Falha ao criar leiloeiro.' };
  }
}

export async function getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  try {
    const auctioneers = await prisma.auctioneer.findMany({
      orderBy: { name: 'asc' }
    });
    return auctioneers as unknown as AuctioneerProfileInfo[];
  } catch (error: any) {
    console.error("Error fetching auctioneers:", error);
    return [];
  }
}

export async function getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> {
  try {
    const auctioneer = await prisma.auctioneer.findFirst({
      where: { OR: [{ id }, { publicId: id }] }
    });
    return auctioneer as unknown as AuctioneerProfileInfo | null;
  } catch (error: any) {
    console.error(`Error fetching auctioneer with ID ${id}:`, error);
    return null;
  }
}

export async function getAuctioneerBySlug(slugOrPublicId: string): Promise<AuctioneerProfileInfo | null> {
  try {
    const auctioneer = await prisma.auctioneer.findFirst({
      where: { OR: [{ slug: slugOrPublicId }, { publicId: slugOrPublicId }] }
    });
    return auctioneer as unknown as AuctioneerProfileInfo | null;
  } catch (error: any) {
    console.error(`Error fetching auctioneer by slug/publicId ${slugOrPublicId}:`, error);
    return null;
  }
}

export async function getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> {
  try {
    const auctioneer = await prisma.auctioneer.findFirst({
      where: { name }
    });
    return auctioneer as unknown as AuctioneerProfileInfo | null;
  } catch (error: any) {
    console.error(`Error fetching auctioneer by name ${name}:`, error);
    return null;
  }
}

export async function getAuctionsByAuctioneerSlug(auctioneerSlugOrPublicId: string): Promise<Auction[]> {
  try {
    const auctions = await prisma.auction.findMany({
      where: {
        auctioneer: {
          OR: [
            { slug: auctioneerSlugOrPublicId },
            { publicId: auctioneerSlugOrPublicId }
          ]
        }
      },
      include: {
        lots: true, // Include lots to get totalLots count
      }
    });
    return auctions as unknown as Auction[];
  } catch (error) {
    console.error(`Error fetching auctions for auctioneer slug/id ${auctioneerSlugOrPublicId}:`, error);
    return [];
  }
}

export async function updateAuctioneer(
  id: string, 
  data: Partial<AuctioneerFormData>
): Promise<{ success: boolean; message: string }> {
  try {
    const updateData: any = { ...data };
    if (data.name) {
      updateData.slug = slugify(data.name);
    }
    await prisma.auctioneer.update({
      where: { id },
      data: updateData,
    });
    revalidatePath('/admin/auctioneers');
    revalidatePath(`/admin/auctioneers/${id}/edit`);
    if(updateData.slug) revalidatePath(`/auctioneers/${updateData.slug}`);
    return { success: true, message: 'Leiloeiro atualizado com sucesso!' };
  } catch (error: any) {
    console.error(`Error updating auctioneer with ID ${id}:`, error);
    return { success: false, message: error.message || 'Falha ao atualizar leiloeiro.' };
  }
}

export async function deleteAuctioneer(
  id: string 
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.auctioneer.delete({ where: { id } });
    revalidatePath('/admin/auctioneers');
    return { success: true, message: 'Leiloeiro excluído com sucesso!' };
  } catch (error: any) {
    console.error(`Error deleting auctioneer with ID ${id}:`, error);
    if (error.code === 'P2003') { // Foreign key constraint failed
      return { success: false, message: 'Não é possível excluir. Este leiloeiro está associado a um ou mais leilões.' };
    }
    return { success: false, message: error.message || 'Falha ao excluir leiloeiro.' };
  }
}
