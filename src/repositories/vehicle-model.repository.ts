// src/repositories/vehicle-model.repository.ts
import { prisma } from '@/lib/prisma';
import type { VehicleModel } from '@/types';
import type { Prisma } from '@prisma/client';

export class VehicleModelRepository {
  async findAll(): Promise<any[]> {
    return prisma.vehicleModel.findMany({
      include: {
        make: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.vehicleModel.findUnique({
      where: { id },
      include: {
        make: { select: { name: true } },
      },
    });
  }

  async create(data: Prisma.VehicleModelCreateInput): Promise<VehicleModel> {
    // @ts-ignore
    return prisma.vehicleModel.create({ data });
  }

  async update(id: string, data: Prisma.VehicleModelUpdateInput): Promise<VehicleModel> {
    // @ts-ignore
    return prisma.vehicleModel.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.vehicleModel.delete({ where: { id } });
  }

  async deleteMany(where: Prisma.VehicleModelWhereInput): Promise<void> {
    await prisma.vehicleModel.deleteMany({ where });
  }
}
