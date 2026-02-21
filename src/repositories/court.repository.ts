// src/repositories/court.repository.ts
import { prisma } from '@/lib/prisma';
import type { Court } from '@/types';
import type { Prisma } from '@prisma/client';

function parseId(id: string): bigint {
  return BigInt(id);
}

function serializeCourt(court: Prisma.Court): Court {
  return {
    ...court,
    id: court.id.toString(),
  };
}

export class CourtRepository {
  async findAll(): Promise<Court[]> {
    const courts = await prisma.court.findMany({ orderBy: { name: 'asc' } });
    return courts.map((court) => serializeCourt(court));
  }

  async findById(id: string): Promise<Court | null> {
    const court = await prisma.court.findUnique({ where: { id: parseId(id) } });
    return court ? serializeCourt(court) : null;
  }

  async create(data: Prisma.CourtCreateInput): Promise<Court> {
    const court = await prisma.court.create({ data });
    return serializeCourt(court);
  }

  async update(id: string, data: Partial<Prisma.CourtUpdateInput>): Promise<Court> {
    const court = await prisma.court.update({ where: { id: parseId(id) }, data });
    return serializeCourt(court);
  }

  async delete(id: string): Promise<void> {
    await prisma.court.delete({ where: { id: parseId(id) } });
  }

  async deleteAll(): Promise<void> {
    await prisma.court.deleteMany({});
  }
}
