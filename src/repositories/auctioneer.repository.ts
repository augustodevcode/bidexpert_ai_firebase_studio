// src/repositories/auctioneer.repository.ts
import { prisma } from '@/lib/prisma';
import type { AuctioneerFormData, AuctioneerProfileInfo } from '@/types';
import type { Prisma } from '@prisma/client';

type AuctioneerWhereInput = Prisma.AuctioneerWhereInput;
type AuctioneerCreateInput = Prisma.AuctioneerCreateInput;
type AuctioneerUpdateInput = Prisma.AuctioneerUpdateInput;

export class AuctioneerRepository {
  private prisma: typeof prisma;

  constructor() {
    this.prisma = prisma;
  }

  async findAll(tenantId: string, limit?: number): Promise<AuctioneerProfileInfo[]> {
    const auctioneers = await this.prisma.auctioneer.findMany({ 
      where: { tenantId: BigInt(tenantId) },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    return auctioneers.map(auctioneer => ({
      ...auctioneer,
      id: auctioneer.id.toString(),
      tenantId: auctioneer.tenantId.toString(),
      userId: auctioneer.userId?.toString() ?? null,
    }));
  }

  async findById(tenantId: string, id: string): Promise<AuctioneerProfileInfo | null> {
    const auctioneer = await this.prisma.auctioneer.findFirst({ 
      where: { 
        id: BigInt(id),
        tenantId: BigInt(tenantId) 
      } 
    });
    
    if (!auctioneer) return null;
    
    return {
      ...auctioneer,
      id: auctioneer.id.toString(),
      tenantId: auctioneer.tenantId.toString(),
      userId: auctioneer.userId?.toString() ?? null,
    };
  }

  async findBySlug(tenantId: string, slugOrId: string): Promise<AuctioneerProfileInfo | null> {
    try {
      const where: AuctioneerWhereInput = {
        tenantId: BigInt(tenantId),
        OR: [
          { slug: slugOrId },
          { publicId: slugOrId },
        ]
      };

      // Só tenta converter para BigInt se o valor for numérico
      if (/^\d+$/.test(slugOrId)) {
        (where.OR as any[]).push({ id: BigInt(slugOrId) });
      }

      const auctioneer = await this.prisma.auctioneer.findFirst({ where });
      
      if (!auctioneer) return null;
      
      return {
        ...auctioneer,
        id: auctioneer.id.toString(),
        tenantId: auctioneer.tenantId.toString(),
        userId: auctioneer.userId?.toString() ?? null,
      };
    } catch (error) {
      console.error('Error in AuctioneerRepository.findBySlug:', error);
      return null;
    }
  }

  async findByName(tenantId: string, name: string): Promise<AuctioneerProfileInfo | null> {
    const auctioneer = await this.prisma.auctioneer.findFirst({ 
      where: { 
        name, 
        tenantId: BigInt(tenantId) 
      } 
    });
    
    if (!auctioneer) return null;
    
    return {
      ...auctioneer,
      id: auctioneer.id.toString(),
      tenantId: auctioneer.tenantId.toString(),
      userId: auctioneer.userId?.toString() ?? null,
    };
  }

  async create(data: AuctioneerCreateInput): Promise<AuctioneerProfileInfo> {
    const auctioneer = await this.prisma.auctioneer.create({ data });
    
    return {
      ...auctioneer,
      id: auctioneer.id.toString(),
      tenantId: auctioneer.tenantId.toString(),
      userId: auctioneer.userId?.toString() ?? null,
    };
  }

  async update(tenantId: string, id: string, data: Partial<AuctioneerFormData>): Promise<AuctioneerProfileInfo> {
    const updateData: AuctioneerUpdateInput = { ...data };
    
    // Converte userId para BigInt se existir
    if (data.userId) {
      updateData.user = { connect: { id: BigInt(data.userId) } };
      delete (updateData as any).userId;
    }
    
    const updatedAuctioneer = await this.prisma.auctioneer.update({ 
      where: { 
        id: BigInt(id), 
        tenantId: BigInt(tenantId) 
      }, 
      data: updateData 
    });
    
    return {
      ...updatedAuctioneer,
      id: updatedAuctioneer.id.toString(),
      tenantId: updatedAuctioneer.tenantId.toString(),
      userId: updatedAuctioneer.userId?.toString() ?? null,
    };
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.auctioneer.delete({ 
      where: { 
        id: BigInt(id), 
        tenantId: BigInt(tenantId) 
      } 
    });
  }
}
