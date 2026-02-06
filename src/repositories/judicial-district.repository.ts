// src/repositories/judicial-district.repository.ts
import { prisma } from '@/lib/prisma';
import type { JudicialDistrict } from '@/types';
import type { Prisma } from '@prisma/client';

export class JudicialDistrictRepository {
  async findAll(): Promise<any[]> { // Return type any to handle complex include
    return prisma.judicialDistrict.findMany({
      include: {
        Court: { select: { name: true } },
        State: { select: { uf: true } }
      },
      orderBy: { name: 'asc' }
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.judicialDistrict.findUnique({
      where: { id },
      include: {
        Court: { select: { name: true } },
        State: { select: { uf: true } }
      }
    });
  }

  async create(data: Prisma.JudicialDistrictCreateInput): Promise<JudicialDistrict> {
    return prisma.judicialDistrict.create({ data });
  }

  async update(id: string, data: Prisma.JudicialDistrictUpdateInput): Promise<JudicialDistrict> {
    return prisma.judicialDistrict.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.judicialDistrict.delete({ where: { id } });
  }

  async deleteAll(): Promise<void> {
    await prisma.judicialDistrict.deleteMany({});
  }
}
