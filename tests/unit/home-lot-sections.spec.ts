/**
 * @fileoverview Testes unitarios para regras de composicao das secoes de lotes da home.
 */

import { describe, expect, it } from 'vitest';

import type { Lot } from '@/types';
import { getMoreActiveLots } from '@/lib/home-lot-sections';

function createLot(id: string, status: Lot['status']): Lot {
  return {
    id,
    auctionId: 'auction-1',
    status,
    title: `Lote ${id}`,
  } as unknown as Lot;
}

describe('getMoreActiveLots', () => {
  it('retorna apenas lotes ativos que nao estao na secao principal', () => {
    const allLots = [
      createLot('lot-1', 'ABERTO_PARA_LANCES'),
      createLot('lot-2', 'ABERTO_PARA_LANCES'),
      createLot('lot-3', 'ENCERRADO'),
      createLot('lot-4', 'ABERTO_PARA_LANCES'),
    ];

    const displayedLots = [allLots[0], allLots[1]];

    const result = getMoreActiveLots({
      allLots,
      displayedLots,
      activeStatuses: ['ABERTO_PARA_LANCES'],
      limit: 8,
    });

    expect(result.map((lot) => lot.id)).toEqual(['lot-4']);
  });

  it('respeita o limite maximo de retorno', () => {
    const allLots = [
      createLot('lot-1', 'ABERTO_PARA_LANCES'),
      createLot('lot-2', 'ABERTO_PARA_LANCES'),
      createLot('lot-3', 'ABERTO_PARA_LANCES'),
    ];

    const result = getMoreActiveLots({
      allLots,
      displayedLots: [],
      activeStatuses: ['ABERTO_PARA_LANCES'],
      limit: 2,
    });

    expect(result.map((lot) => lot.id)).toEqual(['lot-1', 'lot-2']);
  });

  it('retorna vazio quando o limite e zero ou negativo', () => {
    const allLots = [createLot('lot-1', 'ABERTO_PARA_LANCES')];

    expect(getMoreActiveLots({ allLots, displayedLots: [], limit: 0 })).toEqual([]);
    expect(getMoreActiveLots({ allLots, displayedLots: [], limit: -1 })).toEqual([]);
  });

  it('retorna vazio quando nao existem lotes ativos restantes', () => {
    const allLots = [
      createLot('lot-1', 'ENCERRADO'),
      createLot('lot-2', 'SUSPENSO'),
    ];

    const result = getMoreActiveLots({
      allLots,
      displayedLots: [],
      activeStatuses: ['ABERTO_PARA_LANCES'],
      limit: 8,
    });

    expect(result).toEqual([]);
  });
});
