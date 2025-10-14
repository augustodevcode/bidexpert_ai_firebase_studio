// src/repositories/judicial-branch.repository.ts
import { prisma } from '@/lib/prisma';
import type { JudicialBranch } from '@/types';
import type { Prisma } from '@prisma/client';

export class JudicialBranchRepository {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  async findAll(): Promise<any[]> {
    return this.prisma.judicialBranch.findMany({
      include: {
        district: {
          include: {
            state: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.judicialBranch.findUnique({
      where: { id },
      include: {
        district: {
          include: {
            state: true
          }
        }
      }
    });
  }

  async create(data: Prisma.JudicialBranchCreateInput): Promise<JudicialBranch> {
    // @ts-ignore
    return this.prisma.judicialBranch.create({ data });
  }

  async update(id: string, data: Partial<Prisma.JudicialBranchUpdateInput>): Promise<JudicialBranch> {
    // @ts-ignore
    return this.prisma.judicialBranch.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.judicialBranch.delete({ where: { id } });
  }

  async deleteAll(): Promise<void> {
    await this.prisma.judicialBranch.deleteMany({});
  }
}
