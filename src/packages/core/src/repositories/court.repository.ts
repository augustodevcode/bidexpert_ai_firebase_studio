// packages/core/src/repositories/court.repository.ts
import { prisma } from '../lib/prisma';
import type { Court } from '@bidexpert/core';
import type { Prisma } from '@prisma/client';

export class CourtRepository {
  async findAll(): Promise<Court[]> {
    // @ts-ignore
    return prisma.court.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<Court | null> {
    // @ts-ignore
    return prisma.court.findUnique({ where: { id } });
  }

  async create(data: Prisma.CourtCreateInput): Promise<Court> {
    // @ts-ignore
    return prisma.court.create({ data });
  }

  async update(id: string, data: Partial<Prisma.CourtUpdateInput>): Promise<Court> {
    // @ts-ignore
    return prisma.court.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.court.delete({ where: { id } });
  }
}
