// src/app/consignor-dashboard/auctions/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * na página "Meus Leilões" do Painel do Comitente. A configuração inclui
 * renderização de status, faturamento e ações relevantes para o vendedor.
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Pencil } from 'lucide-react';
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
import type { Auction } from '@/types';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const createConsignorAuctionColumns = (): ColumnDef<Auction>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Título" />,
    cell: ({ row }) => (
      <div className="font-medium">
        <Link href={`/admin/auctions/${row.original.id}/edit`} className="hover:text-primary">
          {row.getValue("title")}
        </Link>
        <p className="text-xs text-muted-foreground">ID: {row.original.publicId || row.original.id}</p>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <Badge variant="outline">{getAuctionStatusText(row.getValue("status"))}</Badge>,
    filterFn: (row, id, value) => (value as string[]).includes(row.getValue(id)),
  },
  {
    accessorKey: "totalLots",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lotes" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("totalLots") || 0}</div>
  },
    {
    accessorKey: "achievedRevenue",
    header: () => <div className="text-right">Faturamento</div>,
    cell: ({ row }) => {
        const amount = parseFloat(row.getValue("achievedRevenue") || '0');
        return <div className="text-right font-medium">{amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
    }
  },
  {
    accessorKey: "auctionDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Data do Leilão" />,
    cell: ({ row }) => {
      const date = row.getValue("auctionDate");
      try {
        return date ? format(new Date(date as string), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A';
      } catch {
        return 'Data inválida';
      }
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const auction = row.original;
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
              <Link href={`/auctions/${auction.publicId || auction.id}`} target="_blank"><Eye className="mr-2 h-4 w-4" />Ver Leilão</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/auctions/${auction.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Editar Detalhes</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
