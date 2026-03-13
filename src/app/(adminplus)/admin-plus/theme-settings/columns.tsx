/**
 * @fileoverview Definição de colunas TanStack Table para ThemeSettings — Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { ThemeSettingsRow } from './types';

export const columns: ColumnDef<ThemeSettingsRow>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 80,
  },
  {
    accessorKey: 'name',
    header: 'Nome',
  },
  {
    accessorKey: 'light',
    header: 'Light JSON',
    cell: ({ getValue }) => {
      const v = getValue();
      return v ? 'Configurado' : '—';
    },
  },
  {
    accessorKey: 'dark',
    header: 'Dark JSON',
    cell: ({ getValue }) => {
      const v = getValue();
      return v ? 'Configurado' : '—';
    },
  },
];
