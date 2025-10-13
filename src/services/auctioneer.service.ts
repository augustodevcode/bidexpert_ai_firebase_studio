// src/services/auctioneer.service.ts
/**
 * @fileoverview Este arquivo contém a classe AuctioneerService, que encapsula
 * a lógica de negócio para o gerenciamento de Leiloeiros. Atua como um
 * intermediário entre as server actions (controllers) e o repositório de leiloeiros,
 * garantindo a aplicação de regras como a geração de slug e a validação de dados.
 */
import { AuctioneerRepository } from '@/repositories/auctioneer.repository';
import type { AuctioneerFormData, AuctioneerProfileInfo } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { nowInSaoPaulo, formatInSaoPaulo } from '@/lib/timezone';

export interface AuctioneerDashboardData {
  totalRevenue: number;
  totalAuctions: number;
  totalLots: number;
  lotsSoldCount: number;
  salesRate: number;
  averageTicket: number;
  salesByMonth: { name: string; Faturamento: number }[];
}

export class AuctioneerService {
  private auctioneerRepository: AuctioneerRepository;
  private prisma;

  constructor() {
    this.auctioneerRepository = new AuctioneerRepository();
    this.prisma = prisma;
  }

  async getAuctioneers(tenantId: string, limit?: number): Promise<AuctioneerProfileInfo[]> {
    // @ts-ignore
    return this.auctioneerRepository.findAll(tenantId, limit);
  }

  async getAuctioneerById(tenantId: string, id: string): Promise<AuctioneerProfileInfo | null> {
    // @ts-ignore
    return this.auctioneerRepository.findById(tenantId, id);
  }

  async getAuctioneerBySlug(tenantId: string, slugOrId: string): Promise<AuctioneerProfileInfo | null> {
      // @ts-ignore
      return this.auctioneerRepository.findBySlug(tenantId, slugOrId);
  }

  async createAuctioneer(tenantId: string, data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; }> {
    try {
      const { userId, street, number, complement, neighborhood, cityId, stateId, ...auctioneerData } = data;

      const fullAddress = [street, number, complement, neighborhood].filter(Boolean).join(', ');

      const dataToCreate: Prisma.AuctioneerCreateInput = {
        ...(auctioneerData as any),
        address: fullAddress,
        city: cityId ? (await this.prisma.city.findUnique({where: {id: cityId}}))?.name : undefined,
        state: stateId ? (await this.prisma.state.findUnique({where: {id: stateId}}))?.uf : undefined,
        slug: slugify(data.name),
        publicId: `LEILOE-${uuidv4()}`,
        tenant: { connect: { id: tenantId } },
      };

      if (userId) {
        dataToCreate.user = { connect: { id: userId } };
      }
      
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

  async updateAuctioneer(tenantId: string, id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string }> {
    try {
      const { street, number, complement, neighborhood, cityId, stateId, ...restOfData } = data;

      const dataToUpdate: Partial<Prisma.AuctioneerUpdateInput> = { ...restOfData };
      if (data.name) {
        dataToUpdate.slug = slugify(data.name);
      }
      
      const fullAddress = [
        data.street !== undefined ? data.street : '',
        data.number !== undefined ? data.number : '',
        data.complement !== undefined ? data.complement : '',
        data.neighborhood !== undefined ? data.neighborhood : ''
      ].filter(Boolean).join(', ');

      if (street !== undefined || number !== undefined || complement !== undefined || neighborhood !== undefined) {
        dataToUpdate.address = fullAddress;
      }

      if (cityId) dataToUpdate.city = (await this.prisma.city.findUnique({where: {id: cityId}}))?.name;
      if (stateId) dataToUpdate.state = (await this.prisma.state.findUnique({where: {id: stateId}}))?.uf;

      await this.auctioneerRepository.update(tenantId, id, dataToUpdate);
      return { success: true, message: 'Leiloeiro atualizado com sucesso.' };
    } catch (error: any) {
       console.error(`Error in AuctioneerService.updateAuctioneer for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar leiloeiro: ${error.message}` };
    }
  }
  
  async deleteAuctioneer(tenantId: string, id: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.auctioneerRepository.delete(tenantId, id);
      return { success: true, message: 'Leiloeiro excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in AuctioneerService.deleteAuctioneer for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir leiloeiro: ${error.message}` };
    }
  }

  async getAuctioneerDashboardData(tenantId: string, auctioneerId: string): Promise<AuctioneerDashboardData | null> {
    const auctioneerData = await this.prisma.auctioneer.findFirst({
      where: { id: auctioneerId, tenantId },
      include: {
        _count: {
          select: { auctions: true },
        },
        auctions: {
          include: {
            lots: {
              where: { status: 'VENDIDO', tenantId },
              select: { price: true, updatedAt: true }
            },
            _count: {
              select: { lots: true },
            },
          }
        }
      }
    });

    if (!auctioneerData) return null;

    const allLotsFromAuctions = auctioneerData.auctions.flatMap(auc => auc.lots);
    const totalLots = auctioneerData.auctions.reduce((sum, auc) => sum + auc._count.lots, 0);
    
    const totalRevenue = allLotsFromAuctions.reduce((acc, lot) => acc + (lot.price ? Number(lot.price) : 0), 0);
    const lotsSoldCount = allLotsFromAuctions.length;
    const averageTicket = lotsSoldCount > 0 ? totalRevenue / lotsSoldCount : 0;
    const salesRate = totalLots > 0 ? (lotsSoldCount / totalLots) * 100 : 0;

    const salesByMonthMap = new Map<string, number>();
    const now = nowInSaoPaulo(); // Use timezone-aware function
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthKey = format(date, 'MMM/yy', { locale: ptBR });
      salesByMonthMap.set(monthKey, 0);
    }
    
    allLotsFromAuctions.forEach(lot => {
        const monthKey = formatInSaoPaulo(lot.updatedAt, 'MMM/yy'); // Use timezone-aware function
        if (salesByMonthMap.has(monthKey)) {
            salesByMonthMap.set(monthKey, (salesByMonthMap.get(monthKey) || 0) + (lot.price ? Number(lot.price) : 0));
        }
    });
        
    const salesByMonth = Array.from(salesByMonthMap, ([name, Faturamento]) => ({ name, Faturamento }));

    return {
      totalRevenue,
      totalAuctions: auctioneerData._count.auctions,
      totalLots,
      lotsSoldCount,
      salesRate,
      averageTicket,
      salesByMonth,
    };
  }

  async getAuctioneersPerformance(tenantId: string): Promise<any[]> {
    const auctioneers = await this.prisma.auctioneer.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { auctions: true },
        },
        auctions: {
          include: {
            lots: {
              where: { status: 'VENDIDO', tenantId },
              select: { price: true },
            },
            _count: {
              select: { lots: true },
            },
          },
        },
      },
    });

    return auctioneers.map(auctioneer => {
      const allLotsFromAuctions = auctioneer.auctions.flatMap(auc => auc.lots);
      const totalRevenue = allLotsFromAuctions.reduce((acc, lot) => acc + (lot.price ? Number(lot.price) : 0), 0);
      const lotsSoldCount = allLotsFromAuctions.length;
      const totalLotsInAuctions = auctioneer.auctions.reduce((acc, auc) => acc + auc._count.lots, 0);
      const averageTicket = lotsSoldCount > 0 ? totalRevenue / lotsSoldCount : 0;
      const salesRate = totalLotsInAuctions > 0 ? (lotsSoldCount / totalLotsInAuctions) * 100 : 0;

      return {
        id: auctioneer.id,
        name: auctioneer.name,
        totalAuctions: auctioneer._count.auctions,
        totalLots: totalLotsInAuctions,
        lotsSoldCount,
        totalRevenue,
        averageTicket,
        salesRate,
      };
    });
  }
}
