// packages/core/src/services/court.service.ts
import { CourtRepository } from '../repositories/court.repository';
import type { Court, CourtFormData } from '../types';
import { slugify } from '../lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface CourtPerformanceData {
  id: string;
  name: string;
  totalProcesses: number;
  totalAuctions: number;
  totalLotsSold: number;
  totalRevenue: number;
  averageTicket: number;
}

export class CourtService {
  private repository: CourtRepository;

  constructor() {
    this.repository = new CourtRepository();
  }

  async getCourts(): Promise<Court[]> {
    return this.repository.findAll();
  }

  async getCourtById(id: string): Promise<Court | null> {
    return this.repository.findById(id);
  }

  async createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> {
    try {
      const dataToCreate: Prisma.CourtCreateInput = {
        ...data,
        slug: slugify(data.name),
      };
      
      const newCourt = await this.repository.create(dataToCreate);
      return { success: true, message: 'Tribunal criado com sucesso.', courtId: newCourt.id };
    } catch (error: any) {
      console.error("Error in CourtService.createCourt:", error);
      return { success: false, message: `Falha ao criar tribunal: ${error.message}` };
    }
  }

  async updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const dataToUpdate: Partial<Prisma.CourtUpdateInput> = { ...data };
      if (data.name) {
        dataToUpdate.slug = slugify(data.name);
      }
      await this.repository.update(id, dataToUpdate);
      return { success: true, message: 'Tribunal atualizado com sucesso.' };
    } catch (error: any) {
      console.error(`Error in CourtService.updateCourt for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar tribunal: ${error.message}` };
    }
  }

  async deleteCourt(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.delete(id);
      return { success: true, message: 'Tribunal excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in CourtService.deleteCourt for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir tribunal: ${error.message}` };
    }
  }

  async getCourtsPerformance(): Promise<CourtPerformanceData[]> {
    const courts = await prisma.court.findMany({
      include: {
        _count: {
          select: { judicialProcesses: true },
        },
        auctions: {
          include: {
            lots: {
              where: { status: 'VENDIDO' },
              select: { price: true },
            },
            _count: {
              select: { lots: true },
            },
          },
        },
      },
    });

    return courts.map(court => {
      const allLotsFromAuctions = court.auctions.flatMap(auc => auc.lots);
      const totalRevenue = allLotsFromAuctions.reduce((acc, lot) => acc + (lot.price || 0), 0);
      const totalLotsSold = allLotsFromAuctions.length;
      const averageTicket = totalLotsSold > 0 ? totalRevenue / totalLotsSold : 0;
      const totalAuctions = court.auctions.length;

      return {
        id: court.id,
        name: court.name,
        totalProcesses: court._count.judicialProcesses,
        totalAuctions,
        totalLotsSold,
        totalRevenue,
        averageTicket,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }
}
