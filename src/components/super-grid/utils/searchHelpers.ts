/**
 * @fileoverview Helpers de busca textual do SuperGrid.
 * Centraliza a montagem do WHERE global com suporte a campos aninhados
 * e comparação case-insensitive compatível com MySQL e PostgreSQL.
 */

import { insensitiveContains } from '@/lib/prisma/query-helpers';

export function buildGlobalSearchWhere(
  searchableFields: string[],
  searchTerm: string
): Record<string, unknown>[] {
  return searchableFields.map(field => {
    if (!field.includes('.')) {
      return { [field]: insensitiveContains(searchTerm) };
    }

    const parts = field.split('.');
    let condition: Record<string, unknown> = {
      [parts[parts.length - 1]]: insensitiveContains(searchTerm),
    };

    for (let index = parts.length - 2; index >= 0; index -= 1) {
      condition = { [parts[index]]: condition };
    }

    return condition;
  });
}