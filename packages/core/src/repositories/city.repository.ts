// packages/core/src/repositories/city.repository.ts
import { prisma } from '../lib/prisma';
import type { CityInfo } from '@bidexpert/core';
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
    // @ts-ignore
    return prisma.city.create({ data });
  }

  async update(id: string, data: Prisma.CityUpdateInput): Promise<CityInfo> {
    // @ts-ignore
    return prisma.city.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.city.delete({ where: { id } });
  }
}
