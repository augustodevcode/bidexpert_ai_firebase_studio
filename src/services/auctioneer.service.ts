// src/services/auctioneer.service.ts
import { AuctioneerRepository } from '@/repositories/auctioneer.repository';
import type { AuctioneerFormData, AuctioneerProfileInfo } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class AuctioneerService {
  private auctioneerRepository: AuctioneerRepository;

  constructor() {
    this.auctioneerRepository = new AuctioneerRepository();
  }

  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
    return this.auctioneerRepository.findAll();
  }

  async getAuctioneerById(id: string): Promise<AuctioneerProfileInfo | null> {
    return this.auctioneerRepository.findById(id);
  }

  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; }> {
    try {
      const dataToCreate: Prisma.AuctioneerCreateInput = {
        ...data,
        slug: slugify(data.name),
        publicId: `LEIL-${uuidv4()}`,
      };
      
      const newAuctioneer = await this.auctioneerRepository.create(dataToCreate);
      return { success: true, message: 'Leiloeiro criado com sucesso.', auctioneerId: newAuctioneer.id };
    } catch (error: any) {
      console.error("Error in AuctioneerService.createAuctioneer:", error);
      if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        return { success: false, message: 'Já existe um leiloeiro com este nome.' };
      }
      return { success: false, message: `Falha ao criar leiloeiro: ${error.message}` };
    }
  }

  async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string }> {
    try {
      const dataWithSlug = data.name ? { ...data, slug: slugify(data.name) } : data;
      await this.auctioneerRepository.update(id, dataWithSlug);
      return { success: true, message: 'Leiloeiro atualizado com sucesso.' };
    } catch (error: any) {
       console.error(`Error in AuctioneerService.updateAuctioneer for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar leiloeiro: ${error.message}` };
    }
  }
  
  async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      // In a real app, you'd check for linked auctions. We'll skip for this example.
      // const linkedAuctions = await prisma.auction.count({ where: { auctioneerId: id } });
      // if (linkedAuctions > 0) return { success: false, message: `Cannot delete auctioneer with ${linkedAuctions} active auction(s).`};
      await this.auctioneerRepository.delete(id);
      return { success: true, message: 'Leiloeiro excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in AuctioneerService.deleteAuctioneer for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir leiloeiro: ${error.message}` };
    }
  }
}
