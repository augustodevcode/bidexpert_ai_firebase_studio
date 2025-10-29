// src/repositories/tenant.repository.ts
import { prisma } from '@/lib/prisma';
import type { Prisma, Tenant } from '@prisma/client';

export class TenantRepository {
  async create(data: Prisma.TenantCreateInput): Promise<Tenant> {
    return prisma.tenant.create({ data });
  }

  async findBySubdomain(subdomain: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({
      where: { subdomain },
    });
  }

  async findById(id: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({
      where: { id },
    });
  }

  async deleteMany(args: Prisma.TenantDeleteManyArgs): Promise<Prisma.BatchPayload> {
    return prisma.tenant.deleteMany(args);
  }
}
