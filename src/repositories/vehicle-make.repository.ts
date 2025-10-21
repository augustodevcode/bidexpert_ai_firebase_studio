// src/repositories/vehicle-make.repository.ts
import { prisma } from '@/lib/prisma';
import type { VehicleMake } from '@/types';
import type { Prisma } from '@prisma/client';

export class VehicleMakeRepository {
  async findAll(): Promise<VehicleMake[]> {
    return prisma.vehicleMake.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<VehicleMake | null> {
    return prisma.vehicleMake.findUnique({ where: { id } });
  }
  
  async findByName(name: string): Promise<VehicleMake | null> {
    return prisma.vehicleMake.findUnique({ where: { name } });
  }

  async create(data: Prisma.VehicleMakeCreateInput): Promise<VehicleMake> {
    return prisma.vehicleMake.create({ data });
  }

  async update(id: string, data: Prisma.VehicleMakeUpdateInput): Promise<VehicleMake> {
    return prisma.vehicleMake.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.vehicleMake.delete({ where: { id } });
  }

  async deleteMany(where: Prisma.VehicleMakeWhereInput): Promise<void> {
    await prisma.vehicleMake.deleteMany({ where });
  }
  
  async countModels(makeId: string): Promise<number> {
    return prisma.vehicleModel.count({ where: { makeId } });
  }
}
