// src/services/auction.service.ts
import { AuctionRepository } from '@/repositories/auction.repository';
import type { Auction, AuctionFormData } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class AuctionService {
  private auctionRepository: AuctionRepository;

  constructor() {
    this.auctionRepository = new AuctionRepository();
  }

  private mapAuctionsWithLotCount(auctions: any[]): Auction[] {
    return auctions.map(a => ({
      ...a,
      totalLots: a.lots?.length || 0,
    }));
  }

  async getAuctions(): Promise<Auction[]> {
    const auctions = await this.auctionRepository.findAll();
    return this.mapAuctionsWithLotCount(auctions);
  }

  async getAuctionById(id: string): Promise<Auction | null> {
    const auction = await this.auctionRepository.findById(id);
    if (!auction) return null;
    return {
      ...auction,
      totalLots: auction.lots?.length || 0,
    };
  }

  async createAuction(data: Partial<AuctionFormData>): Promise<{ success: boolean; message: string; auctionId?: string; }> {
    try {
      const dataToCreate: Prisma.AuctionCreateInput = {
        ...(data as any),
        publicId: `AUC-${uuidv4()}`,
        slug: slugify(data.title || ''),
      };
      const newAuction = await this.auctionRepository.create(dataToCreate);
      return { success: true, message: 'Leilão criado com sucesso.', auctionId: newAuction.id };
    } catch (error: any) {
      console.error("Error in AuctionService.createAuction:", error);
      return { success: false, message: `Falha ao criar leilão: ${error.message}` };
    }
  }

  async updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const dataToUpdate: Prisma.AuctionUpdateInput = { ...data };
      if (data.title) {
        dataToUpdate.slug = slugify(data.title);
      }
      await this.auctionRepository.update(id, dataToUpdate);
      return { success: true, message: 'Leilão atualizado com sucesso.' };
    } catch (error: any) {
      console.error(`Error in AuctionService.updateAuction for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar leilão: ${error.message}` };
    }
  }

  async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      const lotCount = await this.auctionRepository.countLots(id);
      if (lotCount > 0) {
        return { success: false, message: `Não é possível excluir. O leilão possui ${lotCount} lote(s) associado(s).` };
      }
      await this.auctionRepository.delete(id);
      return { success: true, message: 'Leilão excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in AuctionService.deleteAuction for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir leilão: ${error.message}` };
    }
  }
}
