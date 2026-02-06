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
import { prisma } from '@/lib/prisma';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { nowInSaoPaulo, formatInSaoPaulo } from '@/lib/timezone';
import { generatePublicId } from '@/lib/public-id-generator';

export interface AuctioneerDashboardData {
  totalRevenue: number;
  totalAuctions: number;
  totalLots: number;
  lotsSoldCount: number;
  salesRate: number;
  averageTicket: number;
  salesByMonth: { name: string; Faturamento: number }[];
}

const mapAuctioneer = (auctioneer: any): AuctioneerProfileInfo => ({
  ...auctioneer,
  userId: auctioneer.userId ?? null,
});

export class AuctioneerService {
  private auctioneerRepository: AuctioneerRepository;
  private prisma;

  constructor() {
    this.auctioneerRepository = new AuctioneerRepository();
    this.prisma = prisma;
  }

  async getAuctioneers(tenantId: string, limit?: number): Promise<AuctioneerProfileInfo[]> {
    const auctioneers = await this.auctioneerRepository.findAll(tenantId, limit);
    return auctioneers.map(mapAuctioneer);
  }

  async getAuctioneerById(tenantId: string, id: string): Promise<AuctioneerProfileInfo | null> {
    const auctioneer = await this.auctioneerRepository.findById(tenantId, id);
    if (!auctioneer) return null;
    return mapAuctioneer(auctioneer);
  }

  async getAuctioneerBySlug(tenantId: string, slugOrId: string): Promise<AuctioneerProfileInfo | null> {
      const auctioneer = await this.auctioneerRepository.findBySlug(tenantId, slugOrId);
      if (!auctioneer) return null;
      return mapAuctioneer(auctioneer);
  }

  async getAuctioneerByName(tenantId: string, name: string): Promise<AuctioneerProfileInfo | null> {
    const auctioneer = await this.auctioneerRepository.findByName(tenantId, name);
    if (!auctioneer) return null;
    return mapAuctioneer(auctioneer);
  }

  async createAuctioneer(tenantId: string, data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; }> {
    try {
      const { 
        userId, street, number, complement, neighborhood, 
        cityId, stateId, latitude, longitude, ...auctioneerData 
      } = data;

      const fullAddress = [street, number, complement, neighborhood].filter(Boolean).join(', ');

      // Gera o publicId usando a máscara configurada
      const publicId = await generatePublicId(tenantId, 'auctioneer');

      const dataToCreate: Prisma.AuctioneerCreateInput = {
        ...(auctioneerData as any),
        address: fullAddress,
        slug: slugify(data.name),
        publicId,
        Tenant: { connect: { id: BigInt(tenantId) } },
      };

      if (userId) {
        (dataToCreate as any).User = { connect: { id: BigInt(userId) } };
      }

      if (cityId) {
        const city = await this.prisma.city.findUnique({ where: { id: BigInt(cityId) }});
        if (city) dataToCreate.city = city.name;
      }

      if (stateId) {
        const state = await this.prisma.state.findUnique({ where: { id: BigInt(stateId) }});
        if (state) dataToCreate.state = state.uf;
      }
      
      const newAuctioneer = await this.auctioneerRepository.create(dataToCreate);
      return { success: true, message: 'Leiloeiro criado com sucesso.', auctioneerId: newAuctioneer.id.toString() };
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
      const { 
        street, number, complement, neighborhood, 
        cityId, stateId, latitude, longitude, ...restOfData 
      } = data;

      const dataToUpdate: Partial<Prisma.AuctioneerUpdateInput> = { ...restOfData };
      
      if (data.name) {
        const newSlug = slugify(data.name);
        const currentAuctioneer = await this.auctioneerRepository.findById(tenantId, id);
        
        if (currentAuctioneer && currentAuctioneer.slug !== newSlug) {
           dataToUpdate.slug = newSlug;
        } else {
           // If slug is same, don't update it to avoid potential conflicts
           if (currentAuctioneer && currentAuctioneer.slug === newSlug) {
             // Ensure slug is NOT in dataToUpdate if it hasn't changed
             // (It wasn't added yet, but just to be safe and explicit about the logic flow)
           } else {
             dataToUpdate.slug = newSlug;
           }
        }
      }
      
      const addressPartsToUpdate = [
        street, number, complement, neighborhood
      ].filter(val => val !== undefined);

      if (addressPartsToUpdate.length > 0) {
        const currentAuctioneer = await this.auctioneerRepository.findById(tenantId, id);
        const currentAddressParts = currentAuctioneer?.address?.split(', ') || [];
        dataToUpdate.address = [
          street ?? currentAddressParts[0] ?? '',
          number ?? currentAddressParts[1] ?? '',
          complement ?? currentAddressParts[2] ?? '',
          neighborhood ?? currentAddressParts[3] ?? ''
        ].filter(Boolean).join(', ');
      }

      if (cityId) {
        const city = await this.prisma.city.findUnique({ where: { id: BigInt(cityId) }});
        if (city) dataToUpdate.city = city.name;
      }
      if (stateId) {
        const state = await this.prisma.state.findUnique({ where: { id: BigInt(stateId) }});
        if (state) dataToUpdate.state = state.uf;
      }

      await this.auctioneerRepository.update(tenantId, id, dataToUpdate);
      return { success: true, message: 'Leiloeiro atualizado com sucesso.' };
    } catch (error: any) {
       if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
          console.warn(`[AuctioneerService] Tentativa de duplicidade ao atualizar leiloeiro ${id}: ${error.meta?.target}`);
          return { success: false, message: 'Já existe um leiloeiro com este nome (slug em uso).' };
       }
       console.error(`Error in AuctioneerService.updateAuctioneer for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar leiloeiro: ${error.message}` };
    }
  }
  
  async deleteAuctioneer(tenantId: string, id: string): Promise<{ success: boolean; message: string; }> {
    try {
      // Disconnect from related models
      await this.prisma.auction.updateMany({ where: { auctioneerId: BigInt(id) }, data: { auctioneerId: null } });
      await this.prisma.lot.updateMany({ where: { auctioneerId: BigInt(id) }, data: { auctioneerId: null } });

      await this.auctioneerRepository.delete(tenantId, id);
      return { success: true, message: 'Leiloeiro excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in AuctioneerService.deleteAuctioneer for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir leiloeiro: ${error.message}` };
    }
  }

  async deleteAllAuctioneers(tenantId: string): Promise<{ success: boolean; message: string; }> {
    try {
      const auctioneers = await this.auctioneerRepository.findAll(tenantId);
      for (const auctioneer of auctioneers) {
        await this.deleteAuctioneer(tenantId, auctioneer.id.toString());
      }
      return { success: true, message: 'Todos os leiloeiros foram excluídos.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todos os leiloeiros.' };
    }
  }

  async getAuctioneerDashboardData(tenantId: string, auctioneerId: string): Promise<AuctioneerDashboardData | null> {
    const auctioneerData: any = await this.prisma.auctioneer.findFirst({
      where: { id: BigInt(auctioneerId), tenantId: BigInt(tenantId) },
      include: {
        _count: {
          select: { Auction: true },
        },
        Auction: {
          include: {
            Lot: {
              where: { status: 'VENDIDO', tenantId: BigInt(tenantId) },
              select: { price: true, updatedAt: true }
            },
            _count: {
              select: { Lot: true },
            },
          }
        }
      }
    });

    if (!auctioneerData) return null;

    const allLotsFromAuctions = (auctioneerData as any).Auction.flatMap((auc: any) => auc.Lot);
    const totalLots = (auctioneerData as any).Auction.reduce((sum: number, auc: any) => sum + auc._count.Lot, 0);
    
    const totalRevenue = allLotsFromAuctions.reduce((acc: number, lot: any) => acc + (lot.price ? Number(lot.price) : 0), 0);
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
    
    allLotsFromAuctions.forEach((lot: any) => {
        const monthKey = formatInSaoPaulo(lot.updatedAt, 'MMM/yy'); // Use timezone-aware function
        if (salesByMonthMap.has(monthKey)) {
            salesByMonthMap.set(monthKey, (salesByMonthMap.get(monthKey) || 0) + (lot.price ? Number(lot.price) : 0));
        }
    });
        
    const salesByMonth = Array.from(salesByMonthMap, ([name, Faturamento]) => ({ name, Faturamento }));

    return {
      totalRevenue,
      totalAuctions: (auctioneerData as any)._count.Auction,
      totalLots,
      lotsSoldCount,
      salesRate,
      averageTicket,
      salesByMonth,
    };
  }

  async getAuctioneersPerformance(tenantId: string): Promise<any[]> {
    const auctioneers: any[] = await this.prisma.auctioneer.findMany({
      where: { tenantId: BigInt(tenantId) },
      include: {
        _count: {
          select: { Auction: true },
        },
        Auction: {
          include: {
            Lot: {
              where: { status: 'VENDIDO', tenantId: BigInt(tenantId) },
              select: { price: true },
            },
            _count: {
              select: { Lot: true },
            },
          },
        },
      },
    });

    return auctioneers.map((auctioneer: any) => {
      const allLotsFromAuctions = auctioneer.Auction.flatMap((auc: any) => auc.Lot);
      const totalRevenue = allLotsFromAuctions.reduce((acc: number, lot: any) => acc + (lot.price ? Number(lot.price) : 0), 0);
      const lotsSoldCount = allLotsFromAuctions.length;
      const totalLotsInAuctions = auctioneer.Auction.reduce((acc: number, auc: any) => acc + auc._count.Lot, 0);
      const averageTicket = lotsSoldCount > 0 ? totalRevenue / lotsSoldCount : 0;
      const salesRate = totalLotsInAuctions > 0 ? (lotsSoldCount / totalLotsInAuctions) * 100 : 0;

      return {
        id: auctioneer.id.toString(),
        name: auctioneer.name,
        totalAuctions: auctioneer._count.Auction,
        totalLots: totalLotsInAuctions,
        lotsSoldCount,
        totalRevenue,
        averageTicket,
        salesRate,
      };
    });
  }
}
