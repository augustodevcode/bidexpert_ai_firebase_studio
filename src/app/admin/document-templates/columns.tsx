
// src/app/admin/document-templates/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import type { DocumentTemplate } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';

const getTemplateTypeLabel = (type: string | undefined) => {
    if (!type) return 'N/A';
    switch (type) {
        case 'WINNING_BID_TERM': return 'Auto de Arrematação';
        case 'EVALUATION_REPORT': return 'Laudo de Avaliação';
        case 'AUCTION_CERTIFICATE': return 'Certificado de Leilão';
        default: return type;
    }
}

export const createColumns = ({ handleDelete }: { handleDelete: (id: string) => void }): ColumnDef<DocumentTemplate>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome do Template" />,
    cell: ({ row }) => (
      <Link href={`/admin/document-templates/${row.original.id}/edit`} className="hover:text-primary font-medium">
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
    cell: ({ row }) => <Badge variant="outline">{getTemplateTypeLabel(row.getValue("type"))}</Badge>,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Última Atualização" />,
    cell: ({ row }) => new Date(row.getValue("updatedAt")).toLocaleString('pt-BR'),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const template = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/admin/document-templates/${template.id}/edit`}><Pencil className="mr-2 h-4 w-4"/>Editar</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDelete(template.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
