import { describe, it, expect } from 'vitest';
import { verifySeed } from '../../scripts/seed-verify';

function makePrisma(counts: {tenant?: number; users?: number; auctions?: number; lots?: number}) {
  return {
    tenant: { count: async ({ where }: any) => counts.tenant ?? 0 },
    user: { count: async () => counts.users ?? 0 },
    auction: { count: async () => counts.auctions ?? 0 },
    lot: { count: async () => counts.lots ?? 0 },
    $disconnect: async () => {}
  } as any;
}

describe('seed-verify', () => {
  it('passes with sufficient counts', async () => {
    const prisma = makePrisma({ tenant: 1, users: 20, auctions: 10, lots: 50 });
    const res = await verifySeed(prisma);
    expect(res).toEqual({ tenant: 1, users: 20, auctions: 10, lots: 50 });
  });

  it('throws when counts are insufficient', async () => {
    const prisma = makePrisma({ tenant: 0, users: 3, auctions: 1, lots: 2 });
    await expect(verifySeed(prisma)).rejects.toThrow(/Seed verification failed/);
  });
});
