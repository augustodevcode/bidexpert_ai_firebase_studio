/**
 * Column definitions for LotQuestion data table.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { LotQuestionRow } from './types';

interface ColumnActions {
  onEdit: (row: LotQuestionRow) => void;
  onDelete: (row: LotQuestionRow) => void;
}

export function getLotQuestionColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<LotQuestionRow>[] {
  return [
    { accessorKey: 'id', header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />, cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span> },
    { accessorKey: 'lotTitle', header: ({ column }) => <DataTableColumnHeader column={column} title="Lote" />, cell: ({ row }) => <span className="font-medium">{row.original.lotTitle}</span> },
    { accessorKey: 'userDisplayName', header: ({ column }) => <DataTableColumnHeader column={column} title="Perguntou" /> },
    { accessorKey: 'questionText', header: ({ column }) => <DataTableColumnHeader column={column} title="Pergunta" />, cell: ({ row }) => <span className="max-w-[200px] truncate block">{row.original.questionText}</span> },
    { accessorKey: 'answerText', header: ({ column }) => <DataTableColumnHeader column={column} title="Resposta" />, cell: ({ row }) => row.original.answerText ? <span className="max-w-[200px] truncate block">{row.original.answerText}</span> : <Badge variant="secondary">Pendente</Badge> },
    { accessorKey: 'isPublic', header: ({ column }) => <DataTableColumnHeader column={column} title="Público" />, cell: ({ row }) => <Badge variant={row.original.isPublic ? 'default' : 'secondary'}>{row.original.isPublic ? 'Sim' : 'Não'}</Badge> },
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
