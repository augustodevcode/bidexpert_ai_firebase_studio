/**
 * @fileoverview Testes unitários para regras temporais compartilhadas de leilões e lotes.
 */

import { describe, expect, it } from 'vitest';
import {
  getAuctionStageChronologyError,
  getEffectiveAuctionStatus,
  getEffectiveLotStatus,
  getLotEffectiveDates,
  normalizeAuctionStages,
} from '@/lib/auction-timing';

describe('auction-timing helpers', () => {
  it('ordena praças cronologicamente antes de renderizar ou persistir', () => {
    const stages = normalizeAuctionStages([
      { id: '2', name: '2a Praca', startDate: new Date('2026-04-12T10:00:00Z'), endDate: new Date('2026-04-12T11:00:00Z') },
      { id: '1', name: '1a Praca', startDate: new Date('2026-04-10T10:00:00Z'), endDate: new Date('2026-04-10T11:00:00Z') },
    ]);

    expect(stages.map((stage) => stage.id)).toEqual(['1', '2']);
  });

  it('detecta cronologia invalida quando uma praca inicia antes do fim da anterior', () => {
    const error = getAuctionStageChronologyError([
      { id: '1', name: '1a Praca', startDate: new Date('2026-04-10T10:00:00Z'), endDate: new Date('2026-04-10T11:00:00Z') },
      { id: '2', name: '2a Praca', startDate: new Date('2026-04-10T10:30:00Z'), endDate: new Date('2026-04-10T12:00:00Z') },
    ]);

    expect(error).toContain('2a Praca');
  });

  it('marca leilao como encerrado quando a data efetiva ja passou, mesmo com status bruto aberto', () => {
    const status = getEffectiveAuctionStatus(
      {
        status: 'ABERTO_PARA_LANCES',
        endDate: '2026-04-10T11:00:00Z',
      } as any,
      new Date('2026-04-10T12:00:00Z'),
    );

    expect(status).toBe('ENCERRADO');
  });

  it('usa a proxima praca valida para calcular datas efetivas do lote', () => {
    const { effectiveLotStartDate, effectiveLotEndDate } = getLotEffectiveDates(
      {
        auctionDate: null,
        endDate: null,
      } as any,
      {
        auctionStages: [
          { id: '2', startDate: '2026-04-12T10:00:00Z', endDate: '2026-04-12T11:00:00Z' },
          { id: '1', startDate: '2026-04-11T10:00:00Z', endDate: '2026-04-11T11:00:00Z' },
        ],
      } as any,
      new Date('2026-04-10T09:00:00Z'),
    );

    expect(effectiveLotStartDate?.toISOString()).toBe('2026-04-11T10:00:00.000Z');
    expect(effectiveLotEndDate?.toISOString()).toBe('2026-04-11T11:00:00.000Z');
  });

  it('marca lote como em breve antes do inicio da janela efetiva', () => {
    const status = getEffectiveLotStatus(
      {
        status: 'ABERTO_PARA_LANCES',
        auctionDate: '2026-04-11T10:00:00Z',
        endDate: '2026-04-11T11:00:00Z',
      } as any,
      undefined,
      new Date('2026-04-11T09:00:00Z'),
    );

    expect(status).toBe('EM_BREVE');
  });
});
