/**
 * @fileoverview Definição de colunas TanStack Table para CounterState — Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { CounterStateRow } from './types';

export const columns: ColumnDef<CounterStateRow>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 80,
  },
  {
    accessorKey: 'entityType',
    header: 'Tipo de Entidade',
  },
  {
    accessorKey: 'currentValue',
    header: 'Valor Atual',
    size: 120,
  },
  {
    accessorKey: 'updatedAt',
    header: 'Atualizado em',
    cell: ({ getValue }) => {
      const v = getValue<string>();
      return v ? new Date(v).toLocaleString('pt-BR') : '—';
    },
  },
];
