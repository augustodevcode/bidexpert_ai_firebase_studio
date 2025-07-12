// src/app/admin/import/cnj/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { CnjHit } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const createColumns = (): ColumnDef<CnjHit>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorFn: (row) => row._source.numeroProcesso,
    id: 'numeroProcesso',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nº do Processo" />,
    cell: ({ row }) => <div className="font-mono">{row.original._source.numeroProcesso}</div>,
  },
  {
    accessorFn: (row) => row._source.classe.nome,
    id: 'classeNome',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Classe" />,
    cell: ({ row }) => row.original._source.classe.nome,
  },
  {
    accessorFn: (row) => row._source.orgaoJulgador.nome,
    id: 'orgaoJulgadorNome',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Órgão Julgador" />,
  },
  {
    accessorFn: (row) => row._source.dataAjuizamento,
    id: 'dataAjuizamento',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Data de Ajuizamento" />,
    cell: ({ row }) => {
      const date = row.original._source.dataAjuizamento;
      try {
        return date ? format(new Date(date), "dd/MM/yyyy", { locale: ptBR }) : 'N/A';
      } catch {
        return 'Data inválida';
      }
    },
  },
  {
    accessorFn: (row) => row._source.tribunal,
    id: 'tribunal',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tribunal" />,
  },
];
