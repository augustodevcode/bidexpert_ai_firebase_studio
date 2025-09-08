// packages/core/src/repositories/judicial-branch.repository.ts
import { prisma } from '../lib/prisma';
import type { JudicialBranch } from '@bidexpert/core';
import type { Prisma } from '@prisma/client';

export class JudicialBranchRepository {
  async findAll(): Promise<any[]> {
    return prisma.judicialBranch.findMany({
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
    return prisma.judicialBranch.findUnique({
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
    return prisma.judicialBranch.create({ data });
  }

  async update(id: string, data: Partial<Prisma.JudicialBranchUpdateInput>): Promise<JudicialBranch> {
    // @ts-ignore
    return prisma.judicialBranch.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.judicialBranch.delete({ where: { id } });
  }
}
