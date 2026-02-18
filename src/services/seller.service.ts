// src/services/seller.service.ts
/**
 * @fileoverview Este arquivo funciona como a camada de Controller, expondo funções que o cliente
 * pode chamar para executar operações de CRUD (Criar, Ler, Atualizar, Excluir)
 * nos comitentes. Ele delega a lógica de negócio para a `SellerService` e garante
 * a aplicação do isolamento de dados por tenant e a revalidação do cache do Next.js
 * quando ocorrem mutações.
 */
import { SellerRepository } from '@/repositories/seller.repository';
import { AuctionRepository } from '@/repositories/auction.repository'; // Importar
import type { SellerFormData, SellerProfileInfo, Lot, Auction } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { nowInSaoPaulo, formatInSaoPaulo } from '@/lib/timezone';
import { generatePublicId } from '@/lib/public-id-generator';

export interface SellerDashboardData {
  totalRevenue: number;
  totalAuctions: number;
  totalLots: number;
  lotsSoldCount: number;
  salesRate: number;
  averageTicket: number;
  salesByMonth: { name: string; Faturamento: number }[];
}

const NON_PUBLIC_STATUSES: Prisma.AuctionStatus[] = ['RASCUNHO', 'EM_PREPARACAO'];

export class SellerService {
  private sellerRepository: SellerRepository;
  private auctionRepository: AuctionRepository; // Adicionar
  private prisma;

  constructor() {
    this.sellerRepository = new SellerRepository();
    this.auctionRepository = new AuctionRepository(); // Instanciar
    this.prisma = prisma;
  }
  
  private mapAuctionsWithDetails(auctions: any[]): Auction[] {
    return auctions.map(a => ({
      ...a,
      initialOffer: a.initialOffer ? Number(a.initialOffer) : undefined,
      totalLots: a._count?.lots ?? a.lots?.length ?? 0,
      seller: a.seller,
    }));
  }

  async getSellers(tenantId: string, limit?: number): Promise<SellerProfileInfo[]> {
    const sellers = await this.sellerRepository.findAll(tenantId, limit);
    
    return sellers.map(s => {
        // Explicitly remove potential relations that might cause serialization issues
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { lots, auctions, judicialProcesses, assets, ...rest } = s as any;
        
        return {
            ...rest,
            id: s.id.toString(),
            tenantId: s.tenantId.toString(),
            userId: s.userId?.toString(),
            judicialBranchId: s.judicialBranchId?.toString(),
            logoMediaId: s.logoMediaId?.toString(),
        };
    });
  }

  async getSellerById(tenantId: string, id: string): Promise<SellerProfileInfo | null> {
    const seller = await this.sellerRepository.findById(tenantId, id);
    if (!seller) return null;
    return {
      ...seller,
      id: seller.id.toString(),
      tenantId: seller.tenantId.toString(),
      userId: seller.userId?.toString(),
      judicialBranchId: seller.judicialBranchId?.toString(),
      logoMediaId: seller.logoMediaId?.toString(),
    };
  }
  
  async findByName(tenantId: string, name: string): Promise<SellerProfileInfo | null> {
    const seller = await this.sellerRepository.findByName(tenantId, name);
    if (!seller) return null;
    return {
      ...seller,
      id: seller.id.toString(),
      tenantId: seller.tenantId.toString(),
      userId: seller.userId?.toString(),
      judicialBranchId: seller.judicialBranchId?.toString(),
      logoMediaId: seller.logoMediaId?.toString(),
    };
  }

  async getSellerBySlug(tenantId: string, slugOrId: string): Promise<SellerProfileInfo | null> {
      const seller = await this.sellerRepository.findBySlug(tenantId, slugOrId);
      if (!seller) return null;
      return {
        ...seller,
        id: seller.id.toString(),
        tenantId: seller.tenantId.toString(),
        userId: seller.userId?.toString(),
        judicialBranchId: seller.judicialBranchId?.toString(),
        logoMediaId: seller.logoMediaId?.toString(),
      };
  }
  
  async getLotsBySellerSlug(tenantId: string, sellerSlugOrId: string): Promise<Lot[]> {
      const seller = await this.sellerRepository.findBySlug(tenantId, sellerSlugOrId);
      if (!seller) return [];
      return this.sellerRepository.findLotsBySellerId(tenantId, seller.id);
  }

  async getAuctionsBySellerSlug(tenantId: string, sellerSlugOrPublicId: string): Promise<Auction[]> {
    const auctions = await this.auctionRepository.findBySellerSlug(tenantId, sellerSlugOrPublicId);
    const publicAuctions = auctions.filter(a => !NON_PUBLIC_STATUSES.includes(a.status));
    return this.mapAuctionsWithDetails(publicAuctions);
  }

  async findJudicialSeller(): Promise<SellerProfileInfo | null> {
    return this.sellerRepository.findFirst({ isJudicial: true });
  }

    async createSeller(tenantId: string, data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
      console.log('Received data in createSeller:', data);
      try {
        const existingSeller = await this.sellerRepository.findByName(tenantId, data.name);
        if (existingSeller) {
          return { success: false, message: 'Já existe um comitente com este nome.' };
        }
  
        const {
          userId, street, number, complement, neighborhood,
          cityId, stateId, latitude, longitude, tenantId: dataTenantId, judicialBranchId, ...sellerData
        } = data;
  
        const fullAddress = [street, number, complement, neighborhood].filter(Boolean).join(', ');
        const addressLink = (latitude && longitude)
          ? `https://www.google.com/maps?q=${latitude},${longitude}`
          : null;
  
        // Gera o publicId usando a máscara configurada
        const publicId = await generatePublicId(tenantId, 'seller');

        const dataToCreate: Prisma.SellerCreateInput = {
          ...(sellerData as any),
          address: fullAddress,
          addressLink,
          street: street ?? null,
          number: number ?? null,
          complement: complement ?? null,
          neighborhood: neighborhood ?? null,
          latitude: latitude ? new Prisma.Decimal(String(latitude)) : null,
          longitude: longitude ? new Prisma.Decimal(String(longitude)) : null,
          cityId: cityId ? BigInt(cityId) : null,
          stateId: stateId ? BigInt(stateId) : null,
          zipCode: (sellerData as any).zipCode ?? null,
          slug: slugify(data.name),
          publicId,
          updatedAt: new Date(),
          Tenant: { connect: { id: BigInt(tenantId) } },
        };
  
        if (userId) (dataToCreate as any).User = { connect: { id: BigInt(userId) } };
        if (cityId) {
          const city = await this.prisma.city.findUnique({ where: { id: BigInt(cityId) }});
          if (city) dataToCreate.city = city.name;
        }
        if (stateId) {
          const state = await this.prisma.state.findUnique({ where: { id: BigInt(stateId) }});
          if (state) dataToCreate.state = state.uf;
        }
        if (judicialBranchId) {
            (dataToCreate as any).JudicialBranch = { connect: { id: BigInt(judicialBranchId) } };
        }
        console.log('Data to create seller in service:', dataToCreate);
        const newSeller = await this.sellerRepository.create(dataToCreate);
        console.log('Result of sellerRepository.create:', newSeller);
        return { success: true, message: 'Comitente criado com sucesso.', sellerId: newSeller.id.toString() };
      } catch (error: any) {
        console.error("Error in SellerService.createSeller:", error);
        console.error("Error details:", error.message, error.stack);
        return { success: false, message: `Falha ao criar comitente: ${error.message}` };
      }
    }
  
    async deleteMany(where: Prisma.SellerWhereInput): Promise<Prisma.BatchPayload> {
      return this.sellerRepository.deleteMany(where);
    }
  async updateSeller(tenantId: string, id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string }> {
    try {
       const { 
        street, number, complement, neighborhood, 
        cityId, stateId, latitude, longitude, ...restOfData 
      } = data;

      const dataToUpdate: Partial<Prisma.SellerUpdateInput> = { ...restOfData };

      if (data.name) {
        const newSlug = slugify(data.name);
        const currentSeller = await this.sellerRepository.findById(tenantId, id);

        if (currentSeller && currentSeller.slug !== newSlug) {
           dataToUpdate.slug = newSlug;
        } else {
           // If slug is same, don't update it
           if (currentSeller && currentSeller.slug === newSlug) {
             // Do nothing, slug is not added to dataToUpdate
           } else {
             dataToUpdate.slug = newSlug;
           }
        }
      }
      
      const addressPartsToUpdate = [
        street, number, complement, neighborhood
      ].filter(val => val !== undefined);

      if (addressPartsToUpdate.length > 0) {
        const currentSeller = await this.sellerRepository.findById(tenantId, id);
        const currentAddressParts = currentSeller?.address?.split(', ') || [];
        dataToUpdate.address = [
          street ?? currentAddressParts[0] ?? '',
          number ?? currentAddressParts[1] ?? '',
          complement ?? currentAddressParts[2] ?? '',
          neighborhood ?? currentAddressParts[3] ?? ''
        ].filter(Boolean).join(', ');
      }

      // Persistir campos individuais de endereço (corrige bug de campos silenciados)
      if (street !== undefined) (dataToUpdate as any).street = street;
      if (number !== undefined) (dataToUpdate as any).number = number;
      if (complement !== undefined) (dataToUpdate as any).complement = complement;
      if (neighborhood !== undefined) (dataToUpdate as any).neighborhood = neighborhood;
      if (latitude !== undefined) (dataToUpdate as any).latitude = latitude ? new Prisma.Decimal(String(latitude)) : null;
      if (longitude !== undefined) (dataToUpdate as any).longitude = longitude ? new Prisma.Decimal(String(longitude)) : null;
      if (cityId !== undefined) (dataToUpdate as any).cityId = cityId ? BigInt(cityId) : null;
      if (stateId !== undefined) (dataToUpdate as any).stateId = stateId ? BigInt(stateId) : null;

      // Gerar addressLink automaticamente
      const effectiveLat = latitude ?? (await this.sellerRepository.findById(tenantId, id))?.latitude;
      const effectiveLng = longitude ?? (await this.sellerRepository.findById(tenantId, id))?.longitude;
      if (effectiveLat && effectiveLng) {
        (dataToUpdate as any).addressLink = `https://www.google.com/maps?q=${effectiveLat},${effectiveLng}`;
      }
      
      if (cityId) {
        const city = await this.prisma.city.findUnique({ where: { id: BigInt(cityId) }});
        if (city) dataToUpdate.city = city.name;
      }
      if (stateId) {
        const state = await this.prisma.state.findUnique({ where: { id: BigInt(stateId) }});
        if (state) dataToUpdate.state = state.uf;
      }

      await this.sellerRepository.update(tenantId, id, dataToUpdate);
      return { success: true, message: 'Comitente atualizado com sucesso.' };
    } catch (error: any) {
       if (error.code === 'P2002' && (error.meta?.target?.includes('slug') || error.meta?.target?.includes('name'))) {
          console.warn(`[SellerService] Tentativa de duplicidade ao atualizar comitente ${id}: ${error.meta?.target}`);
          return { success: false, message: 'Já existe um comitente com este nome (slug ou nome em uso).' };
       }
       console.error(`Error in SellerService.updateSeller for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar comitente: ${error.message}` };
    }
  }
  
  async deleteSeller(tenantId: string, id: string): Promise<{ success: boolean; message: string; }> {
    try {
      // Disconnect from related models
      await this.prisma.auction.updateMany({ where: { sellerId: BigInt(id) }, data: { sellerId: null } });
      await this.prisma.lot.updateMany({ where: { sellerId: BigInt(id) }, data: { sellerId: null } });
      await this.prisma.asset.updateMany({ where: { sellerId: BigInt(id) }, data: { sellerId: null } });
      await this.prisma.judicialProcess.updateMany({ where: { sellerId: BigInt(id) }, data: { sellerId: null } });

      await this.sellerRepository.delete(tenantId, id);
      return { success: true, message: 'Comitente excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in SellerService.deleteSeller for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir comitente: ${error.message}` };
    }
  }

  async deleteAllSellers(tenantId: string): Promise<{ success: boolean; message: string; }> {
    try {
      const sellers = await this.sellerRepository.findAll(tenantId);
      for (const seller of sellers) {
        await this.deleteSeller(tenantId, seller.id);
      }
      return { success: true, message: 'Todos os comitentes foram excluídos.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todos os comitentes.' };
    }
  }
  
  async getSellerDashboardData(tenantId: string, sellerId: string): Promise<SellerDashboardData | null> {
    const sellerData = await this.prisma.seller.findFirst({
      where: { id: BigInt(sellerId), tenantId: BigInt(tenantId) },
      include: {
        _count: {
          select: { Auction: true, Lot: true },
        },
        Lot: {
          where: { status: 'VENDIDO', tenantId: BigInt(tenantId) },
          select: { price: true, updatedAt: true }
        },
      },
    });

    if (!sellerData) return null;

    const soldLots = (sellerData as any).Lot;
    const totalRevenue = soldLots.reduce((acc: number, lot: any) => acc + (lot.price ? Number(lot.price) : 0), 0);
    const lotsSoldCount = soldLots.length;
    const countLots = (sellerData._count as any).Lot;
    const countAuctions = (sellerData._count as any).Auction;
    const salesRate = countLots > 0 ? (lotsSoldCount / countLots) * 100 : 0;

    const averageTicket = lotsSoldCount > 0 ? totalRevenue / lotsSoldCount : 0;

    const salesByMonthMap = new Map<string, number>();
    const now = nowInSaoPaulo(); // Use timezone-aware function
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthKey = format(date, 'MMM/yy', { locale: ptBR });
      salesByMonthMap.set(monthKey, 0);
    }

    soldLots.forEach((lot: any) => {
      const monthKey = formatInSaoPaulo(lot.updatedAt, 'MMM/yy'); // Use timezone-aware function
      if (salesByMonthMap.has(monthKey)) {
        salesByMonthMap.set(monthKey, (salesByMonthMap.get(monthKey) || 0) + (lot.price ? Number(lot.price) : 0));
      }
    });
    
    const salesByMonth = Array.from(salesByMonthMap, ([name, Faturamento]) => ({ name, Faturamento }));

    return {
      totalRevenue,
      totalAuctions: countAuctions,
      totalLots: countLots,
      lotsSoldCount,
      salesRate,
      averageTicket,
      salesByMonth,
    };
  }
}
