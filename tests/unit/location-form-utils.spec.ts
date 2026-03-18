/**
 * @fileoverview Garante consistência entre estado e cidade no formulário de leilão V2.
 */

import { describe, expect, it } from 'vitest';
import { getCitiesForState, shouldResetCitySelection } from '@/app/admin/auctions-v2/location-form-utils';

const cities = [
  { id: '10', stateId: '1', name: 'São Paulo' },
  { id: '11', stateId: '1', name: 'Campinas' },
  { id: '20', stateId: '2', name: 'Rio de Janeiro' },
];

describe('location-form-utils', () => {
  it('filtra cidades pelo estado selecionado', () => {
    expect(getCitiesForState(cities, '1')).toEqual([
      { id: '10', stateId: '1', name: 'São Paulo' },
      { id: '11', stateId: '1', name: 'Campinas' },
    ]);
  });

  it('mantém a cidade quando ela pertence ao estado atual', () => {
    expect(shouldResetCitySelection({ cityId: '10', stateId: '1', cities })).toBe(false);
  });

  it('limpa a cidade quando o estado muda e a seleção fica órfã', () => {
    expect(shouldResetCitySelection({ cityId: '10', stateId: '2', cities })).toBe(true);
  });
});