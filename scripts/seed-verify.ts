import { PrismaClient } from '@prisma/client';

export type SeedCounts = {
  tenant: number;
  users: number;
  auctions: number;
  lots: number;
};

export async function verifySeed(prismaParam?: PrismaClient): Promise<SeedCounts> {
  const prisma = prismaParam ?? new PrismaClient();
  let disconnected = false;
  try {
    const tenant = await (prisma as any).tenant.count({ where: { id: 1 } });
    const users = await (prisma as any).user.count();
    const auctions = await (prisma as any).auction.count();
    const lots = await (prisma as any).lot.count();

    const errors: string[] = [];
    if (!tenant || tenant === 0) errors.push('Tenant 1 missing');
    if (users < 10) errors.push(`Users < 10 (found ${users})`);
    if (auctions < 5) errors.push(`Auctions < 5 (found ${auctions})`);
    if (lots < 10) errors.push(`Lots < 10 (found ${lots})`);

    if (errors.length) {
      throw new Error(`Seed verification failed: ${errors.join('; ')}`);
    }

    return { tenant, users, auctions, lots };
  } finally {
    if (!prismaParam) {
      // only disconnect if we created the client
      disconnected = true;
      await (prisma as PrismaClient).$disconnect();
    }
  }
}

// CLI wrapper
if (typeof require !== 'undefined' && (require as any).main === module) {
  (async () => {
    try {
      const result = await verifySeed();
      console.log('✅ Seed verification passed:', result);
      process.exit(0);
    } catch (err: any) {
      console.error('❌', err.message || err);
      process.exit(2);
    }
  })();
}
