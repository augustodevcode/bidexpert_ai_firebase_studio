// src/services/auction-stage.service.ts
/**
 * @fileoverview Este arquivo contém a classe AuctionStageService, que encapsula
 * a lógica de negócio para o gerenciamento de etapas de leilão (AuctionStage).
 * Responsabilidades incluem criar, atualizar e buscar etapas de leilão.
 */
import { PrismaClient, AuctionStage } from '@prisma/client';

const prisma = new PrismaClient();

export class AuctionStageService {
  async createAuctionStage(data: { auctionId: string; stageNumber: number; startDate: Date; endDate: Date; }) {
    try {
      const auctionStage = await prisma.auctionStage.create({ data });
      return { success: true, auctionStage };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async getAuctionStageById(id: string): Promise<AuctionStage | null> {
    return prisma.auctionStage.findUnique({ where: { id } });
  }

  async getAuctionStagesByAuctionId(auctionId: string): Promise<AuctionStage[]> {
    return prisma.auctionStage.findMany({ where: { auctionId }, orderBy: { stageNumber: 'asc' } });
  }

  // Add other methods as needed (update, delete, etc.)
}
