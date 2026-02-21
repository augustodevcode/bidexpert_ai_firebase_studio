// src/repositories/city.repository.ts
import { prisma } from '@/lib/prisma';
import type { CityInfo } from '@/types';
import type { Prisma } from '@prisma/client';

type CityWithState = Prisma.CityGetPayload<{
  include?: {
    State?: {
      select: { uf: true };
    };
  };
}>;

function parseId(id: string): bigint {
  return BigInt(id);
}

function serializeCity(city: CityWithState): CityInfo {
  return {
    id: city.id.toString(),
    name: city.name,
    stateId: city.stateId.toString(),
    ibgeCode: city.ibgeCode,
    slug: city.slug,
    lotCount: city.lotCount ?? undefined,
    createdAt: city.createdAt,
    updatedAt: city.updatedAt,
    stateUf: (city as any).State?.uf,
    latitude: (city as any).latitude ?? null,
    longitude: (city as any).longitude ?? null,
  };
}

export class CityRepository {
  async findAll(stateIdFilter?: string): Promise<CityInfo[]> {
    const cities = await prisma.city.findMany({
      where: stateIdFilter ? { stateId: parseId(stateIdFilter) } : {},
      include: {
        State: {
          select: { uf: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return cities.map((city) => serializeCity(city));
  }

  async findById(id: string): Promise<CityInfo | null> {
    const city = await prisma.city.findUnique({
      where: { id: parseId(id) },
      include: {
        State: { select: { uf: true } },
      },
    });

    return city ? serializeCity(city) : null;
  }
  
  async findByIbgeCode(ibgeCode: string): Promise<CityInfo | null> {
    const city = await prisma.city.findUnique({ where: { ibgeCode } });
    return city ? serializeCity(city) : null;
  }

  async create(data: Prisma.CityCreateInput): Promise<CityInfo> {
    const city = await prisma.city.create({ data });
    return serializeCity(city as CityWithState);
  }

  async update(id: string, data: Prisma.CityUpdateInput): Promise<CityInfo> {
    const city = await prisma.city.update({ where: { id: parseId(id) }, data });
    return serializeCity(city as CityWithState);
  }

  async upsert(data: Prisma.CityCreateInput): Promise<CityInfo> {
    const stateConnect = (data as any).State?.connect ?? (data as any).state?.connect;
    if (!stateConnect?.id) {
      throw new Error('State connection is required for city upsert');
    }
    const city = await prisma.city.upsert({
      where: { name_stateId: { name: data.name, stateId: stateConnect.id } },
      update: {
        name: data.name,
        slug: data.slug,
        ibgeCode: data.ibgeCode,
      },
      create: data,
    });
    return serializeCity(city as CityWithState);
  }

  async delete(id: string): Promise<void> {
    await prisma.city.delete({ where: { id: parseId(id) } });
  }

  async deleteAll(): Promise<void> {
    await prisma.city.deleteMany({});
  }
}
