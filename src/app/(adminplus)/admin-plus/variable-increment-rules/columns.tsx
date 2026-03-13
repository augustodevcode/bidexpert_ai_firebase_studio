/**
 * @fileoverview Definição de colunas TanStack Table para VariableIncrementRule — Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { VariableIncrementRuleRow } from './types';

export const columns: ColumnDef<VariableIncrementRuleRow>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 80,
  },
  {
    accessorKey: 'from',
    header: 'De (R$)',
    cell: ({ getValue }) => {
      const v = getValue<number>();
      return v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '—';
    },
  },
  {
    accessorKey: 'to',
    header: 'Até (R$)',
    cell: ({ getValue }) => {
      const v = getValue<number | null>();
      return v != null ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '∞ (Sem limite)';
    },
  },
  {
    accessorKey: 'increment',
    header: 'Incremento (R$)',
    cell: ({ getValue }) => {
      const v = getValue<number>();
      return v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '—';
    },
  },
];
