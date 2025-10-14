// src/repositories/report.repository.ts
import { prisma } from '@/lib/prisma';
import type { Report, Prisma } from '@prisma/client';

export class ReportRepository {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  async findAll(tenantId: string): Promise<Report[]> {
    return this.prisma.report.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string): Promise<Report | null> {
    return this.prisma.report.findFirst({
      where: { id, tenantId },
    });
  }

  async create(data: Prisma.ReportCreateInput): Promise<Report> {
    return this.prisma.report.create({ data });
  }

  async update(tenantId: string, id: string, data: Partial<Prisma.ReportUpdateInput>): Promise<Report> {
    return this.prisma.report.update({
      where: { id, tenantId },
      data,
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.report.delete({
      where: { id, tenantId },
    });
  }

  async deleteAll(tenantId: string): Promise<void> {
    await this.prisma.report.deleteMany({ where: { tenantId } });
  }
}
