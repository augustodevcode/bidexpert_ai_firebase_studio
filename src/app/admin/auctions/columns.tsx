// src/app/admin/auctions/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * que exibe a lista de Leilões. Inclui cabeçalhos, renderização de células com
 * links, e um menu de ações para cada linha (editar, excluir, etc.). Demonstra
 * o uso do componente `DataTableColumnHeader` para ordenação e a lógica para
 * desabilitar a exclusão de leilões que não estão em um estado seguro para remoção.
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Trash2, LayoutDashboard, Tv } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import type { Auction } from '@/types';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader, ClientOnlyDate } from '@/components/ui/data-table-column-header';
import { getAuctionStatusText } from '@/lib/ui-helpers';

export const createColumns = ({ handleDelete, onOpenDashboard }: { handleDelete: (id: string) => void; onOpenDashboard: (auction: Auction) => void; }): ColumnDef<Auction>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Título" />,
    cell: ({ row }) => (
      <div className="font-medium">
        <button onClick={() => onOpenDashboard(row.original)} className="hover:text-primary text-left">
          {row.getValue("title")}
        </button>
        <p className="text-xs text-muted-foreground">ID: {row.original.publicId || row.original.id}</p>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <Badge variant="outline">{getAuctionStatusText(row.getValue("status"))}</Badge>,
    filterFn: (row, id, value) => (value as string[]).includes(row.getValue(id)),
    enableGrouping: true,
  },
  {
    accessorKey: "auctioneerName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Leiloeiro" />,
    enableGrouping: true,
  },
  {
    accessorKey: "sellerName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Comitente" />,
    enableGrouping: true,
  },
  {
    accessorKey: "totalLots",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lotes" />,
    cell: ({ row }) => {
      const totalLots = row.getValue("totalLots") as number || 0;
      const auctionId = row.original.publicId || row.original.id;
      return (
        <Link href={`/admin/lots?auctionId=${auctionId}`} className="text-primary hover:underline">
          {totalLots} lotes
        </Link>
      );
    }
  },
  {
    accessorKey: "auctionDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Data do Leilão" />,
    cell: ({ row }) => <ClientOnlyDate date={row.getValue("auctionDate")} format="dd/MM/yyyy HH:mm" />,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const auction = row.original;
      const canDelete = auction.status === 'RASCUNHO' || auction.status === 'CANCELADO';
      const canMonitor = ['EM_PREPARACAO', 'EM_BREVE', 'ABERTO', 'ABERTO_PARA_LANCES', 'EM_PREGAO'].includes(auction.status);
      const isLive = auction.status === 'ABERTO_PARA_LANCES' || auction.status === 'EM_PREGAO';
      return (
        <div className="flex items-center justify-end gap-1" data-ai-id="auction-row-actions">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild data-ai-id="auction-view-btn">
            <Link href={`/auctions/${auction.publicId || auction.id}`} target="_blank">
              <Eye className="h-4 w-4" />
              <span className="sr-only">Visualizar Leilão</span>
            </Link>
          </Button>
          {canMonitor && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className={`h-8 w-8 ${isLive ? 'text-destructive' : ''}`} asChild data-ai-id="auction-monitor-btn">
                    <Link href={`/auctions/${auction.publicId || auction.id}/monitor`} target="_blank" rel="noopener noreferrer">
                      <Tv className={`h-4 w-4 ${isLive ? 'animate-pulse' : ''}`} />
                      <span className="sr-only">Monitor do Pregão</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isLive ? 'Pregão AO VIVO — Abrir Monitor' : 'Abrir Monitor do Pregão'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenDashboard(auction)} data-ai-id="auction-dashboard-btn">
            <LayoutDashboard className="h-4 w-4" />
            <span className="sr-only">Preparar Leilão</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild data-ai-id="auction-edit-btn">
            <Link href={`/admin/auctions-v2/${auction.publicId || auction.id}`}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(auction.id)} disabled={!canDelete} title={!canDelete ? "Apenas leilões em Rascunho ou Cancelado podem ser excluídos" : "Excluir Leilão"} data-ai-id="auction-delete-btn">
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="sr-only">Excluir</span>
          </Button>
        </div>
      );
    },
  },
];
