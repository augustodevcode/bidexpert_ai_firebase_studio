/**
 * @fileoverview Definições de colunas TanStack Table para a listagem de Usuários no Admin Plus.
 * Exibe nome, email, tipo de conta, status de habilitação, perfis, telefone e ações.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

export interface UserRow {
  id: string;
  fullName: string;
  email: string;
  accountType: string;
  habilitationStatus: string;
  cellPhone: string;
  roleNames: string[];
  createdAt: Date | string;
}

const habilitationVariantMap: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  HABILITADO: 'default',
  PENDING_DOCUMENTS: 'outline',
  PENDING_ANALYSIS: 'secondary',
  REJECTED_DOCUMENTS: 'destructive',
  BLOCKED: 'destructive',
};

const habilitationLabelMap: Record<string, string> = {
  HABILITADO: 'Habilitado',
  PENDING_DOCUMENTS: 'Pendente Docs',
  PENDING_ANALYSIS: 'Em Análise',
  REJECTED_DOCUMENTS: 'Rejeitado',
  BLOCKED: 'Bloqueado',
};

const accountTypeLabelMap: Record<string, string> = {
  PHYSICAL: 'Pessoa Física',
  LEGAL: 'Pessoa Jurídica',
  DIRECT_SALE_CONSIGNOR: 'Comitente',
};

export const columns = (
  onDelete: (row: UserRow) => void,
): ColumnDef<UserRow>[] => [
  {
    accessorKey: 'fullName',
    header: 'Nome',
    cell: ({ row }) => (
      <span className="font-medium" data-ai-id="user-row-fullname">
        {row.original.fullName}
      </span>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm" data-ai-id="user-row-email">
        {row.original.email}
      </span>
    ),
  },
  {
    accessorKey: 'accountType',
    header: 'Tipo',
    cell: ({ row }) => (
      <Badge variant="outline" data-ai-id="user-row-accountType">
        {accountTypeLabelMap[row.original.accountType] ?? row.original.accountType}
      </Badge>
    ),
  },
  {
    accessorKey: 'habilitationStatus',
    header: 'Habilitação',
    cell: ({ row }) => {
      const status = row.original.habilitationStatus;
      return (
        <Badge
          variant={habilitationVariantMap[status] ?? 'outline'}
          data-ai-id="user-row-habilitationStatus"
        >
          {habilitationLabelMap[status] ?? status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'roleNames',
    header: 'Perfis',
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1" data-ai-id="user-row-roles">
        {row.original.roleNames.map((name) => (
          <Badge key={name} variant="secondary" className="text-xs">
            {name}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    accessorKey: 'cellPhone',
    header: 'Celular',
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm" data-ai-id="user-row-cellphone">
        {row.original.cellPhone}
      </span>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" data-ai-id="user-row-actions-trigger">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Ações para {row.original.fullName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" data-ai-id="user-row-actions-menu">
          <DropdownMenuItem asChild>
            <Link href={`/admin-plus/users/${row.original.id}`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(row.original)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
