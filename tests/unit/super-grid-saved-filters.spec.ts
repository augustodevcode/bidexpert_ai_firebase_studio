/**
 * @fileoverview Testes unitários para filtros avançados salvos do SuperGrid.
 */

import { describe, expect, it } from 'vitest';
import {
  readSavedGridFilters,
  removeSavedGridFilter,
  upsertSavedGridFilter,
} from '@/components/super-grid/utils/savedFilterHelpers';

describe('SuperGrid saved filters', () => {
  it('cria e lê filtros salvos por escopo de usuário e grid', () => {
    const result = upsertSavedGridFilter(undefined, '10', 'auctions-supergrid', {
      name: 'Status aberto',
      query: { combinator: 'and', rules: [{ field: 'status', operator: '=', value: 'ABERTO_PARA_LANCES' }] },
      now: '2026-04-24T10:00:00.000Z',
      createId: () => 'filter-1',
    });

    expect(readSavedGridFilters(result.preferences, '10', 'auctions-supergrid')).toEqual([
      {
        id: 'filter-1',
        name: 'Status aberto',
        query: { combinator: 'and', rules: [{ field: 'status', operator: '=', value: 'ABERTO_PARA_LANCES' }] },
        createdAt: '2026-04-24T10:00:00.000Z',
        updatedAt: '2026-04-24T10:00:00.000Z',
      },
    ]);
  });

  it('atualiza o mesmo filtro quando o nome já existe no mesmo escopo/grid', () => {
    const first = upsertSavedGridFilter(undefined, '10', 'auctions-supergrid', {
      name: 'Status aberto',
      query: { combinator: 'and', rules: [] },
      now: '2026-04-24T10:00:00.000Z',
      createId: () => 'filter-1',
    });

    const second = upsertSavedGridFilter(first.preferences, '10', 'auctions-supergrid', {
      name: 'status aberto',
      query: { combinator: 'and', rules: [{ field: 'status', operator: '=', value: 'ENCERRADO' }] },
      now: '2026-04-24T11:00:00.000Z',
      createId: () => 'filter-2',
    });

    expect(readSavedGridFilters(second.preferences, '10', 'auctions-supergrid')).toEqual([
      {
        id: 'filter-1',
        name: 'status aberto',
        query: { combinator: 'and', rules: [{ field: 'status', operator: '=', value: 'ENCERRADO' }] },
        createdAt: '2026-04-24T10:00:00.000Z',
        updatedAt: '2026-04-24T11:00:00.000Z',
      },
    ]);
  });

  it('mantém isolamento por escopo ao remover um filtro salvo', () => {
    const first = upsertSavedGridFilter(undefined, '10', 'auctions-supergrid', {
      name: 'Tenant 10',
      query: { combinator: 'and', rules: [] },
      now: '2026-04-24T10:00:00.000Z',
      createId: () => 'filter-10',
    });

    const second = upsertSavedGridFilter(first.preferences, '11', 'auctions-supergrid', {
      name: 'Tenant 11',
      query: { combinator: 'and', rules: [] },
      now: '2026-04-24T10:05:00.000Z',
      createId: () => 'filter-11',
    });

    const cleaned = removeSavedGridFilter(second.preferences, '10', 'auctions-supergrid', 'filter-10');

    expect(readSavedGridFilters(cleaned, '10', 'auctions-supergrid')).toEqual([]);
    expect(readSavedGridFilters(cleaned, '11', 'auctions-supergrid')).toEqual([
      {
        id: 'filter-11',
        name: 'Tenant 11',
        query: { combinator: 'and', rules: [] },
        createdAt: '2026-04-24T10:05:00.000Z',
        updatedAt: '2026-04-24T10:05:00.000Z',
      },
    ]);
  });
});