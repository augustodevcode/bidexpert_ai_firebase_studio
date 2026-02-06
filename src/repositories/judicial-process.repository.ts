// src/repositories/judicial-process.repository.ts
import { prisma } from '@/lib/prisma';
import type { JudicialProcess } from '@/types';
import type { Prisma } from '@prisma/client';

export class JudicialProcessRepository {
  async findAll(tenantId: string): Promise<any[]> {
    return prisma.judicialProcess.findMany({
      where: { tenantId },
      include: {
        Court: { select: { name: true } },
        JudicialDistrict: { select: { name: true } },
        JudicialBranch: { select: { name: true } },
        Seller: { select: { name: true } },
        Auction: {
          select: {
            id: true,
            title: true,
            status: true,
            publicId: true
          }
        },
        JudicialParty: true,
        _count: {
          select: { Lot: true, Asset: true },
        },
      },
      orderBy: { processNumber: 'desc' }
    });
  }

  async findById(tenantId: string, id: string): Promise<any | null> {
    return prisma.judicialProcess.findFirst({
      where: { id, tenantId },
      include: {
        Court: { select: { name: true } },
        JudicialDistrict: { select: { name: true } },
        JudicialBranch: { select: { name: true } },
        Seller: { select: { name: true } },
        Auction: true,
        Lot: true,
        Asset: true,
        JudicialParty: true,
      },
    });
  }

  async create(data: Prisma.JudicialProcessCreateInput): Promise<JudicialProcess> {
    // @ts-ignore
    return prisma.judicialProcess.create({ data });
  }

  async update(tenantId: string, id: string, data: Partial<Prisma.JudicialProcessUpdateInput>, parties: any[] | undefined): Promise<JudicialProcess> {
    return prisma.$transaction(async (tx) => {
        const updatedProcess = await tx.judicialProcess.update({
            where: { id, tenantId },
            data: data,
        });

        if (parties) {
            // Delete existing relations for parties
            await tx.judicialParty.deleteMany({ where: { processId: id } });
            // Create new relations for parties
            if (parties.length > 0) {
              await tx.judicialProcess.update({
                  where: { id, tenantId },
                  data: {
                      parties: {
                          create: parties,
                      },
                  },
              });
            }
        }
        return updatedProcess;
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
     await prisma.$transaction(async (tx) => {
        await tx.judicialParty.deleteMany({ where: { processId: id }});
        await tx.judicialProcess.delete({ where: { id, tenantId } });
    });
  }
}
