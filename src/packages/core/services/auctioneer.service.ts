// packages/core/src/services/auctioneer.service.ts
import { AuctioneerRepository } from '../repositories/auctioneer.repository';
import { AuctionRepository } from '../repositories/auction.repository';
import type { AuctioneerFormData, AuctioneerProfileInfo, Auction, SellerDashboardData as AuctioneerDashboardData } from '../types';
import { slugify } from '../lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlatformSettingsService } from './platform-settings.service';

export type { AuctioneerDashboardData };

export class AuctioneerService {
  private auctioneerRepository: AuctioneerRepository;
  private auctionRepository: AuctionRepository;
  private settingsService: PlatformSettingsService;

  constructor() {
    this.auctioneerRepository = new AuctioneerRepository();
    this.auctionRepository = new AuctionRepository();
    this.settingsService = new PlatformSettingsService();
  }

  private mapAuctionsWithDetails(auctions: any[]): Auction[] {
    return auctions.map(a => ({
      ...a,
      totalLots: a._count?.lots ?? a.lots?.length ?? 0,
      seller: a.seller, // Pass the full seller object
      auctioneer: a.auctioneer, // Pass the full auctioneer object
      category: a.category, // Pass the full category object
      sellerName: a.seller?.name, 
      auctioneerName: a.auctioneer?.name,
      categoryName: a.category?.name,
      auctionStages: a.stages || a.auctionStages || [],
    }));
  }

  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
    return this.auctioneerRepository.findAll();
  }

  async getAuctioneerById(id: string): Promise<AuctioneerProfileInfo | null> {
    return this.auctioneerRepository.findById(id);
  }

  async getAuctioneerBySlug(slugOrId: string): Promise<AuctioneerProfileInfo | null> {
    return this.auctioneerRepository.findBySlug(slugOrId);
  }
  
  async getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
    const auctions = await this.auctionRepository.findByAuctioneerSlug(auctioneerSlug);
    return this.mapAuctionsWithDetails(auctions);
  }

  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; }> {
    try {
      const dataToCreate: Prisma.AuctioneerCreateInput = {
        ...data,
        slug: slugify(data.name),
        publicId: `LEILOE-${uuidv4()}`,
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
      const linkedAuctions = await this.auctionRepository.findByAuctioneerSlug(id);
      if (linkedAuctions.length > 0) {
        return { success: false, message: `Não é possível excluir. O leiloeiro está vinculado a ${linkedAuctions.length} leilão(ões).` };
      }
      await this.auctioneerRepository.delete(id);
      return { success: true, message: 'Leiloeiro excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in AuctioneerService.deleteAuctioneer for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir leiloeiro: ${error.message}` };
    }
  }

  async getAuctioneerDashboardData(auctioneerId: string): Promise<AuctioneerDashboardData | null> {
    const [auctioneerData, platformSettings] = await Promise.all([
        prisma.auctioneer.findUnique({
            where: { id: auctioneerId },
            include: {
                _count: {
                  select: { auctions: true },
                },
                auctions: {
                  include: {
                    lots: {
                      where: { status: 'VENDIDO' },
                      select: { price: true, updatedAt: true }
                    },
                    _count: {
                      select: { lots: true },
                    },
                  }
                }
            }
        }),
        this.settingsService.getSettings()
    ]);


    if (!auctioneerData) return null;

    const allLotsFromAuctions = auctioneerData.auctions.flatMap(auc => auc.lots);
    const totalLots = auctioneerData.auctions.reduce((sum, auc) => sum + auc._count.lots, 0);
    
    const totalRevenue = allLotsFromAuctions.reduce((acc, lot) => acc + (lot.price || 0), 0);
    const lotsSoldCount = allLotsFromAuctions.length;
    const averageTicket = lotsSoldCount > 0 ? totalRevenue / lotsSoldCount : 0;
    const salesRate = totalLots > 0 ? (lotsSoldCount / totalLots) * 100 : 0;

    const salesByMonthMap = new Map<string, number>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthKey = format(date, 'MMM/yy', { locale: ptBR });
      salesByMonthMap.set(monthKey, 0);
    }
    
    allLotsFromAuctions.forEach(lot => {
        const monthKey = format(new Date(lot.updatedAt), 'MMM/yy', { locale: ptBR });
        if (salesByMonthMap.has(monthKey)) {
            salesByMonthMap.set(monthKey, (salesByMonthMap.get(monthKey) || 0) + (lot.price || 0));
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

  async getAuctioneersPerformance(): Promise<any[]> {
    const auctioneers = await this.auctioneerRepository.findAll();
    const performanceData = await Promise.all(
        auctioneers.map(async (auctioneer) => {
            const dashboardData = await this.getAuctioneerDashboardData(auctioneer.id);
            return {
                id: auctioneer.id,
                name: auctioneer.name,
                totalAuctions: dashboardData?.totalAuctions || 0,
                totalLots: dashboardData?.totalLots || 0,
                lotsSoldCount: dashboardData?.lotsSoldCount || 0,
                totalRevenue: dashboardData?.totalRevenue || 0,
                averageTicket: dashboardData?.averageTicket || 0,
                salesRate: dashboardData?.salesRate || 0,
            };
        })
    );
    return performanceData.sort((a,b) => b.totalRevenue - a.totalRevenue);
  }
}
