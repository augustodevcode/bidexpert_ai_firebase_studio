/**
 * Column definitions for LotRisk data table.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { LOT_RISK_TYPES, LOT_RISK_LEVELS } from './schema';
import type { LotRiskRow } from './types';

interface ColumnActions {
  onEdit: (row: LotRiskRow) => void;
  onDelete: (row: LotRiskRow) => void;
}

const riskLevelVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  BAIXO: 'secondary',
  MEDIO: 'outline',
  ALTO: 'default',
  CRITICO: 'destructive',
};

export function getLotRiskColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<LotRiskRow>[] {
  return [
    { accessorKey: 'id', header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />, cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span> },
    { accessorKey: 'lotTitle', header: ({ column }) => <DataTableColumnHeader column={column} title="Lote" />, cell: ({ row }) => <span className="font-medium">{row.original.lotTitle}</span> },
    { accessorKey: 'riskType', header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />, cell: ({ row }) => LOT_RISK_TYPES.find((t) => t.value === row.original.riskType)?.label ?? row.original.riskType },
    { accessorKey: 'riskLevel', header: ({ column }) => <DataTableColumnHeader column={column} title="Nível" />, cell: ({ row }) => <Badge variant={riskLevelVariant[row.original.riskLevel] ?? 'secondary'}>{LOT_RISK_LEVELS.find((l) => l.value === row.original.riskLevel)?.label ?? row.original.riskLevel}</Badge> },
    { accessorKey: 'verified', header: ({ column }) => <DataTableColumnHeader column={column} title="Verificado" />, cell: ({ row }) => <Badge variant={row.original.verified ? 'default' : 'secondary'}>{row.original.verified ? 'Sim' : 'Não'}</Badge> },
    { accessorKey: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Criado em" />, cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('pt-BR') },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Ações</span></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
