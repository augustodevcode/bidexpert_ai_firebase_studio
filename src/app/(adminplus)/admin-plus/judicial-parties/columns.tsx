/**
 * Colunas da tabela de JudicialParty (Parte Processual).
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { PARTY_TYPE_OPTIONS } from './schema';
import type { JudicialPartyRow } from './types';

interface Props { onEdit: (row: JudicialPartyRow) => void; onDelete: (row: JudicialPartyRow) => void; }

export function getJudicialPartyColumns({ onEdit, onDelete }: Props): ColumnDef<JudicialPartyRow>[] {
  return [
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />, cell: ({ row }) => <span className="font-medium" data-ai-id="judicial-party-name">{row.getValue('name')}</span> },
    { accessorKey: 'documentNumber', header: ({ column }) => <DataTableColumnHeader column={column} title="Documento" /> },
    { accessorKey: 'partyType', header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />, cell: ({ row }) => { const label = PARTY_TYPE_OPTIONS.find(o => o.value === row.getValue('partyType'))?.label || row.getValue('partyType'); return <Badge variant="secondary" data-ai-id="judicial-party-type">{label as string}</Badge>; } },
    { accessorKey: 'processNumber', header: ({ column }) => <DataTableColumnHeader column={column} title="Processo" /> },
    { id: 'actions', cell: ({ row }) => (<DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-ai-id="judicial-party-actions"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Ações</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onEdit(row.original)}>Editar</DropdownMenuItem><DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive">Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu>) },
  ];
}
