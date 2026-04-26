/**
 * @fileoverview Testes unitários para busca rápida e operadores textuais do SuperGrid.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { getSearchableColumns } from '@/components/super-grid/utils/columnHelpers';
import { convertQueryBuilderToPrisma } from '@/components/super-grid/utils/prismaQueryBuilder';
import { buildGlobalSearchWhere } from '@/components/super-grid/utils/searchHelpers';
import type { GridColumn } from '@/components/super-grid/SuperGrid.types';

const originalDatabaseUrl = process.env.DATABASE_URL;

describe('SuperGrid search contracts', () => {
  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('inclui colunas select e relacionais na busca global', () => {
    const columns: GridColumn[] = [
      {
        id: 'title',
        accessorKey: 'title',
        header: 'Titulo',
        type: 'string',
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        type: 'select',
      },
      {
        id: 'auctioneerName',
        accessorKey: 'Auctioneer.name',
        header: 'Leiloeiro',
        type: 'string',
        relation: {
          relationName: 'Auctioneer',
          displayField: 'name',
          valueField: 'id',
        },
      },
      {
        id: 'totalLots',
        accessorKey: 'totalLots',
        header: 'Lotes',
        type: 'number',
      },
    ];

    expect(getSearchableColumns(columns)).toEqual([
      'title',
      'status',
      'Auctioneer.name',
    ]);
  });

  it('monta OR global com contains case-insensitive para campos aninhados', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/bidexpert';

    expect(buildGlobalSearchWhere(['title', 'Auctioneer.name'], 'aberto')).toEqual([
      { title: { contains: 'aberto', mode: 'insensitive' } },
      {
        Auctioneer: {
          name: { contains: 'aberto', mode: 'insensitive' },
        },
      },
    ]);
  });

  it('usa operadores textuais compatíveis com Postgres no query builder', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/bidexpert';

    expect(
      convertQueryBuilderToPrisma({
        combinator: 'and',
        rules: [
          {
            field: 'Auctioneer.name',
            operator: 'contains',
            value: 'silva',
          },
          {
            field: 'title',
            operator: 'startsWith',
            value: 'leil',
          },
        ],
      })
    ).toEqual({
      AND: [
        {
          Auctioneer: {
            name: { contains: 'silva', mode: 'insensitive' },
          },
        },
        {
          title: { startsWith: 'leil', mode: 'insensitive' },
        },
      ],
    });
  });
});