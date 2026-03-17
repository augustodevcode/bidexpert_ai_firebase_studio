import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  getAuctionStageVisualState,
  getFormStageVisualState,
  getLotStageVisualState,
} from '../../src/components/auction/auction-stage-visuals';

describe('auction-stage-visuals', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('mapeia status bruto da praça do leilão para aberto', () => {
    expect(getAuctionStageVisualState('EM_ANDAMENTO', 'upcoming')).toBe('open');
  });

  it('mapeia status bruto da praça do leilão para encerrado', () => {
    expect(getAuctionStageVisualState('ENCERRADO', 'active')).toBe('closed');
  });

  it('mapeia lote destacado vendido para estado com venda', () => {
    expect(getLotStageVisualState('VENDIDO', 'completed', true, 'ENCERRADO')).toBe('sold');
  });

  it('mapeia lote destacado aberto para estado aberto', () => {
    expect(getLotStageVisualState('ABERTO_PARA_LANCES', 'active', true, 'EM_ANDAMENTO')).toBe('open');
  });

  it('retorna rascunho no form quando faltam dados mínimos', () => {
    expect(getFormStageVisualState({ name: '', startDate: null, endDate: null })).toBe('draft');
  });

  it('retorna em breve no form quando a praça ainda não iniciou', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-16T12:00:00.000Z'));

    expect(
      getFormStageVisualState({
        name: '2ª Praça',
        startDate: new Date('2026-03-18T12:00:00.000Z'),
        endDate: new Date('2026-03-19T12:00:00.000Z'),
      })
    ).toBe('scheduled');
  });
});