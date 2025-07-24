// src/repositories/judicial-process.repository.ts
import { prisma } from '@/lib/prisma';
import type { JudicialProcess } from '@/types';
import type { Prisma } from '@prisma/client';

export class JudicialProcessRepository {
  async findAll(): Promise<any[]> {
    return prisma.judicialProcess.findMany({
      include: {
        court: { select: { name: true } },
        district: { select: { name: true } },
        branch: { select: { name: true } },
        seller: { select: { name: true } },
        parties: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.judicialProcess.findUnique({
      where: { id },
      include: {
        court: { select: { name: true } },
        district: { select: { name: true } },
        branch: { select: { name: true } },
        seller: { select: { name: true } },
        parties: true,
      },
    });
  }

  async create(data: Prisma.JudicialProcessCreateInput): Promise<JudicialProcess> {
    // @ts-ignore
    return prisma.judicialProcess.create({ data });
  }

  async update(id: string, data: Partial<Prisma.JudicialProcessUpdateInput>, parties: any[] | undefined): Promise<JudicialProcess> {
    return prisma.$transaction(async (tx) => {
        const updatedProcess = await tx.judicialProcess.update({
            where: { id },
            data: data,
        });

        if (parties) {
            await tx.judicialParty.deleteMany({ where: { processId: id } });
            await tx.judicialProcess.update({
                where: { id },
                data: {
                    parties: {
                        create: parties,
                    },
                },
            });
        }
        return updatedProcess;
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.judicialProcess.delete({ where: { id } });
  }
}
