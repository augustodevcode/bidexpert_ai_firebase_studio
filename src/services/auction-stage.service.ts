// src/services/auction-stage.service.ts
/**
 * @fileoverview Este arquivo contém a classe AuctionStageService, que encapsula
 * a lógica de negócio para o gerenciamento de etapas de leilão (AuctionStage).
 * Responsabilidades incluem criar, atualizar e buscar etapas de leilão.
 */
import { AuctionStageRepository } from '@/repositories/auction-stage.repository';
import type { Prisma, AuctionStage } from '@prisma/client';

export class AuctionStageService {
  private repository: AuctionStageRepository;

  constructor() {
    this.repository = new AuctionStageRepository();
  }

  async createAuctionStage(data: Prisma.AuctionStageCreateInput): Promise<{ success: boolean; auctionStage?: AuctionStage; message?: string }> {
    try {
      const auctionStage = await this.repository.create(data);
      return { success: true, auctionStage };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async getAuctionStageById(id: string): Promise<AuctionStage | null> {
    return this.repository.findById(id);
  }

  async getAuctionStagesByAuctionId(auctionId: string): Promise<AuctionStage[]> {
    return this.repository.findMany({ auctionId });
  }

  async deleteMany(where: Prisma.AuctionStageWhereInput): Promise<Prisma.BatchPayload> {
    return this.repository.deleteMany(where);
  }
}
