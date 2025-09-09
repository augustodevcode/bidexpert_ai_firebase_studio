// src/app/admin/auctioneers/actions.ts
'use server';

import { AuctioneerService } from '@bidexpert/services';
import { revalidatePath } from 'next/cache';
import { AuctioneerFormData } from '@bidexpert/core'; // Assuming this type is correct

const auctioneerService = new AuctioneerService();
const entityName = 'Leiloeiro';
const routeBase = '/admin/auctioneers';

export async function getAuctioneers() {
  return auctioneerService.findAll();
}

export async function getAuctioneer(id: string) {
  return auctioneerService.findById(id);
}

export async function getAuctioneerBySlug(slug: string) {
  return auctioneerService.findBySlug(slug);
}

export async function createAuctioneer(data: AuctioneerFormData) {
  const result = await auctioneerService.create(data);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath(routeBase);
  }
  return result;
}

export async function updateAuctioneer(id: string, data: AuctioneerFormData) {
  const result = await auctioneerService.update(id, data);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath(routeBase);
    revalidatePath(`${routeBase}/${id}/edit`);
  }
  return result;
}

export async function deleteAuctioneer(id: string) {
  const result = await auctioneerService.delete(id);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath(routeBase);
  }
  return result;
}

// Funções específicas que não se encaixam no CRUD padrão permanecem aqui
export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string) {
    return auctioneerService.getAuctionsByAuctioneerSlug(auctioneerSlug);
}