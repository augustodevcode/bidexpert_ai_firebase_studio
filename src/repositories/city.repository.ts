// src/repositories/city.repository.ts
import { prisma } from '@/lib/prisma';
import type { CityInfo } from '@/types';
import type { Prisma } from '@prisma/client';

export class CityRepository {
  async findAll(stateIdFilter?: string): Promise<any[]> {
    return prisma.city.findMany({
      where: stateIdFilter ? { stateId: stateIdFilter } : {},
      include: {
        state: {
          select: { uf: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.city.findUnique({
      where: { id },
      include: {
        state: { select: { uf: true } },
      },
    });
  }
  
  async findByIbgeCode(ibgeCode: string): Promise<any | null> {
    return prisma.city.findUnique({ where: { ibgeCode } });
  }

  async create(data: Prisma.CityCreateInput): Promise<CityInfo> {
    return prisma.city.create({ data });
  }

  async update(id: string, data: Prisma.CityUpdateInput): Promise<CityInfo> {
    return prisma.city.update({ where: { id }, data });
  }

  async upsert(data: Prisma.CityCreateInput): Promise<CityInfo> {
    return prisma.city.upsert({
      where: { name_stateId: { name: data.name, stateId: data.state.connect.id } },
      update: data,
      create: data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.city.delete({ where: { id } });
  }

  async deleteAll(): Promise<void> {
    await prisma.city.deleteMany({});
  }
}
