// src/app/admin/users/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { UserProfileWithPermissions } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader, ClientOnlyDate } from '@/components/ui/data-table-column-header';
import { getUserHabilitationStatusInfo } from '@/lib/ui-helpers';
import Link from 'next/link';
import { Eye, MoreHorizontal, Pencil, Trash2, Ban, ShieldAlert } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ColumnsProps {
  handleDelete: (id: string) => void;
  handleShadowBan?: (userId: string, applyBan: boolean) => void;
  onEdit?: (user: UserProfileWithPermissions) => void;
  onAssignRoles?: (user: UserProfileWithPermissions) => void;
}

export const createColumns = ({ handleDelete, handleShadowBan, onEdit, onAssignRoles }: ColumnsProps): ColumnDef<UserProfileWithPermissions>[] => [
   {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() 
            ? true 
            : table.getIsSomePageRowsSelected() 
              ? "indeterminate" 
              : false
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
    accessorKey: "fullName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome Completo" />,
    cell: ({ row }) => (
      <div className="font-medium">
        <Link href={`/admin/users/${row.original.id}/edit`} className="hover:text-primary">
          {row.getValue("fullName")}
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: "roleNames",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Perfil" />,
    cell: ({ row }) => {
      const roleNames = row.original.roleNames || [];
      if (roleNames.length === 0) {
        return <span className="text-xs text-muted-foreground">N/A</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {roleNames.map(name => <Badge key={name} variant="secondary">{name}</Badge>)}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const roleNames = row.original.roleNames || [];
      return (value as string[]).some(v => roleNames.includes(v));
    },
    enableGrouping: true,
  },
  {
    accessorKey: "habilitationStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Habilitação" />,
    cell: ({ row }) => {
      const status = row.getValue("habilitationStatus");
      const statusInfo = getUserHabilitationStatusInfo(status as any);
      const Icon = statusInfo.icon;
      return <Badge variant="outline" className="flex items-center gap-1.5"><Icon className="h-3 w-3" />{statusInfo.text}</Badge>;
    },
    filterFn: (row, id, value) => {
      return (value as string[]).includes(row.getValue(id))
    },
    enableGrouping: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Criado em" />,
    cell: ({ row }) => <ClientOnlyDate date={row.getValue("createdAt")} />,
  },
  {
    id: "shadowBanStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const badges = row.original.badges as Record<string, unknown> | null;
      const isShadowBanned = badges?.shadowBanned === true;
      
      if (isShadowBanned) {
        return (
          <Badge variant="destructive" className="flex items-center gap-1" data-ai-id="shadow-ban-badge">
            <ShieldAlert className="h-3 w-3" />
            Shadow Ban
          </Badge>
        );
      }
      return <Badge variant="outline" className="text-green-600">Ativo</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      const badges = user.badges as Record<string, unknown> | null;
      const isShadowBanned = badges?.shadowBanned === true;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" data-ai-id={`user-actions-${user.id}`}>
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Ações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/admin/habilitations/${user.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Habilitação
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/users/${user.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {handleShadowBan && (
              <DropdownMenuItem 
                onClick={() => handleShadowBan(user.id, !isShadowBanned)}
                className={isShadowBanned ? 'text-green-600' : 'text-orange-600'}
              >
                <Ban className="mr-2 h-4 w-4" />
                {isShadowBanned ? 'Remover Shadow Ban' : 'Aplicar Shadow Ban'}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={() => handleDelete(user.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
