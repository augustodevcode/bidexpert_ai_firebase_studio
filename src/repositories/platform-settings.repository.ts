import { prisma } from '@/lib/prisma';
import type { Prisma, PlatformSettings } from '@prisma/client';

export class PlatformSettingsRepository {

  async findByTenantId(tenantId: bigint): Promise<PlatformSettings | null> {
    return prisma.platformSettings.findUnique({
      where: { tenantId },
    });
  }

  async create(tenantId: bigint, data: Partial<Prisma.PlatformSettingsCreateInput>): Promise<PlatformSettings> {
    return prisma.platformSettings.create({
      data: {
        ...data,
        Tenant: { connect: { id: tenantId } },
      },
    });
  }
}
