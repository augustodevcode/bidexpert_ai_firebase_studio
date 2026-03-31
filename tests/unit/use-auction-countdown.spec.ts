import { describe, expect, it } from 'vitest';
import { addDays, subDays } from 'date-fns';

import { resolveAuctionCountdownStage } from '@/app/auctions/[auctionId]/hooks/use-auction-countdown';

describe('resolveAuctionCountdownStage', () => {
  it('returns the active stage when one stage is currently running', () => {
    const now = new Date('2026-04-10T12:00:00Z');
    const result = resolveAuctionCountdownStage([
      {
        id: '1',
        name: '1ª Praça',
        startDate: subDays(now, 1),
        endDate: addDays(now, 1),
      },
      {
        id: '2',
        name: '2ª Praça',
        startDate: addDays(now, 2),
        endDate: addDays(now, 3),
      },
    ] as any, now);

    expect(result?.stage.name).toBe('1ª Praça');
    expect(result?.stageNumber).toBe(1);
  });

  it('returns the next upcoming stage when no stage is active yet', () => {
    const now = new Date('2026-03-31T12:00:00Z');
    const result = resolveAuctionCountdownStage([
      {
        id: '1',
        name: '1ª Praça',
        startDate: addDays(now, 1),
        endDate: addDays(now, 22),
      },
      {
        id: '2',
        name: '2ª Praça',
        startDate: addDays(now, 22),
        endDate: addDays(now, 23),
      },
    ] as any, now);

    expect(result?.stage.name).toBe('1ª Praça');
    expect(result?.stageNumber).toBe(1);
  });

  it('falls back to the last stage only after all stages are finished', () => {
    const now = new Date('2026-05-10T12:00:00Z');
    const result = resolveAuctionCountdownStage([
      {
        id: '1',
        name: '1ª Praça',
        startDate: subDays(now, 10),
        endDate: subDays(now, 8),
      },
      {
        id: '2',
        name: '2ª Praça',
        startDate: subDays(now, 7),
        endDate: subDays(now, 5),
      },
    ] as any, now);

    expect(result?.stage.name).toBe('2ª Praça');
    expect(result?.stageNumber).toBe(2);
  });
});