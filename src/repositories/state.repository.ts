// src/repositories/state.repository.ts
import { prisma } from '@/lib/prisma';
import type { StateInfo } from '@/types';
import type { Prisma } from '@prisma/client';

export class StateRepository {
  async findAllWithCityCount() {
    return prisma.state.findMany({
      include: {
        _count: {
          select: { cities: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async findById(id: string): Promise<StateInfo | null> {
    return prisma.state.findUnique({ where: { id } });
  }

  async findByUf(uf: string): Promise<StateInfo | null> {
    return prisma.state.findUnique({ where: { uf } });
  }

  async create(data: Prisma.StateCreateInput): Promise<StateInfo> {
    return prisma.state.create({ data });
  }

  async update(id: string, data: Prisma.StateUpdateInput): Promise<StateInfo> {
    return prisma.state.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.state.delete({ where: { id } });
  }
  
  async countCities(stateId: string): Promise<number> {
    return prisma.city.count({ where: { stateId } });
  }
}
