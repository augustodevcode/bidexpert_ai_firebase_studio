/**
 * @fileoverview Utilitários para consistência entre estado e cidade no formulário de leilão V2.
 */

export type LocationOption = {
  id: string;
  stateId: string;
  name: string;
};

export function getCitiesForState(cities: LocationOption[], stateId?: string | null) {
  if (!stateId) {
    return [];
  }

  return cities.filter((city) => city.stateId === stateId);
}

export function shouldResetCitySelection(params: {
  cityId?: string | null;
  stateId?: string | null;
  cities: LocationOption[];
}) {
  const { cityId, stateId, cities } = params;

  if (!cityId || !stateId) {
    return false;
  }

  return !cities.some((city) => city.id === cityId && city.stateId === stateId);
}