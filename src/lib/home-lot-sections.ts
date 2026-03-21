/**
 * @fileoverview Regras utilitarias para composicao de secoes de lotes na home.
 */

import type { Lot } from '@/types';

interface GetMoreActiveLotsInput {
  allLots: Lot[];
  displayedLots: Lot[];
  activeStatuses?: ReadonlyArray<Lot['status']>;
  limit?: number;
}

const DEFAULT_ACTIVE_STATUSES: ReadonlyArray<Lot['status']> = ['ABERTO_PARA_LANCES'];

export function getMoreActiveLots({
  allLots,
  displayedLots,
  activeStatuses = DEFAULT_ACTIVE_STATUSES,
  limit = 8,
}: GetMoreActiveLotsInput): Lot[] {
  if (limit <= 0) {
    return [];
  }

  const displayedIds = new Set(displayedLots.map((lot) => lot.id));

  return allLots
    .filter((lot) => activeStatuses.includes(lot.status) && !displayedIds.has(lot.id))
    .slice(0, limit);
}
