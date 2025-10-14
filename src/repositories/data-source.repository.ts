// src/repositories/data-source.repository.ts
import { prisma } from '@/lib/prisma';
import type { DataSource, Prisma as PrismaTypes } from '@prisma/client';

export class DataSourceRepository {
  async findAll(): Promise<DataSource[]> {
    return prisma.dataSource.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<DataSource | null> {
    return prisma.dataSource.findUnique({ where: { id } });
  }

  async create(data: PrismaTypes.DataSourceCreateInput): Promise<DataSource> {
    return prisma.dataSource.create({ data });
  }

  async update(id: string, data: PrismaTypes.DataSourceUpdateInput): Promise<DataSource> {
    return prisma.dataSource.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.dataSource.delete({ where: { id } });
  }

  async deleteAll(): Promise<void> {
    await prisma.dataSource.deleteMany({});
  }
}
