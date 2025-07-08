/**
 * @fileoverview Server Actions for managing Auctioneer profiles.
 * 
 * This file contains the server-side logic for creating, reading, updating,
 * and deleting auctioneer profiles (AuctioneerProfileInfo). These functions
 * interact directly with the Prisma client to perform database operations
 * and revalidate Next.js cache where necessary to reflect changes in the UI.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { AuctioneerProfileInfo, AuctioneerFormData, Auction } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new auctioneer profile in the database.
 * @param {AuctioneerFormData} data - The auctioneer data from the form.
 * @returns {Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }>} 
 * An object indicating the result of the operation.
 */
export async function createAuctioneer(
  data: AuctioneerFormData
): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> {
  try {
    const newAuctioneer = await prisma.auctioneer.create({
      data: {
        ...data,
        publicId: `AUCT-PUB-${uuidv4().substring(0,8)}`,
        slug: slugify(data.name),
        userId: data.userId || null,
        rating: data.rating || null,
        memberSince: data.memberSince ? new Date(data.memberSince) : null,
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

/**
 * Fetches all auctioneer profiles from the database.
 * @returns {Promise<AuctioneerProfileInfo[]>} An array of all auctioneers.
 */
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

/**
 * Fetches a single auctioneer by their internal ID or public ID.
 * @param {string} id - The internal or public ID of the auctioneer.
 * @returns {Promise<AuctioneerProfileInfo | null>} The auctioneer profile or null if not found.
 */
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

/**
 * Fetches a single auctioneer by their slug or public ID.
 * @param {string} slugOrPublicId - The slug or public ID of the auctioneer.
 * @returns {Promise<AuctioneerProfileInfo | null>} The auctioneer profile or null if not found.
 */
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

/**
 * Fetches a single auctioneer by their exact name.
 * @param {string} name - The name of the auctioneer.
 * @returns {Promise<AuctioneerProfileInfo | null>} The auctioneer profile or null if not found.
 */
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

/**
 * Fetches all auctions conducted by a specific auctioneer.
 * @param {string} auctioneerSlugOrPublicId - The slug or public ID of the auctioneer.
 * @returns {Promise<Auction[]>} An array of auctions associated with the auctioneer.
 */
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
        lots: { select: { id: true }},
      }
    });
    return auctions.map(a => ({
        ...a,
        totalLots: a.lots.length,
    })) as unknown as Auction[];
  } catch (error) {
    console.error(`Error fetching auctions for auctioneer slug/id ${auctioneerSlugOrPublicId}:`, error);
    return [];
  }
}

/**
 * Updates an existing auctioneer's profile.
 * @param {string} id - The internal ID of the auctioneer to update.
 * @param {Partial<AuctioneerFormData>} data - The partial data to update.
 * @returns {Promise<{ success: boolean; message: string; }>} An object indicating the result.
 */
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

/**
 * Deletes an auctioneer from the database.
 * @param {string} id - The internal ID of the auctioneer to delete.
 * @returns {Promise<{ success: boolean; message: string; }>} An object indicating the result.
 */
export async function deleteAuctioneer(
  id: string 
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.auctioneer.delete({ where: { id } });
    revalidatePath('/admin/auctioneers');
    return { success: true, message: 'Leiloeiro excluído com sucesso!' };
  } catch (error: any)
{
    console.error(`Error deleting auctioneer with ID ${id}:`, error);
    if (error.code === 'P2003') { // Foreign key constraint failed
      return { success: false, message: 'Não é possível excluir. Este leiloeiro está associado a um ou mais leilões.' };
    }
    return { success: false, message: error.message || 'Falha ao excluir leiloeiro.' };
  }
}
