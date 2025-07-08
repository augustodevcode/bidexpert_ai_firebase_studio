// src/app/admin/habilitations/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { UserProfileData } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { getUserHabilitationStatusInfo } from '@/lib/sample-data-helpers';
import Link from 'next/link';
import { Eye } from 'lucide-react';

export const createColumns = (): ColumnDef<UserProfileData>[] => [
  {
    accessorKey: "fullName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome do Usuário" />,
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue("fullName")}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: "habilitationStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("habilitationStatus");
      const statusInfo = getUserHabilitationStatusInfo(status as any);
      const Icon = statusInfo.icon;
      return <Badge variant="outline" className="flex items-center gap-1.5"><Icon className="h-3 w-3" />{statusInfo.text}</Badge>;
    },
    filterFn: (row, id, value) => (value as string[]).includes(row.getValue(id)),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Última Atualização" />,
    cell: ({ row }) => new Date(row.getValue("updatedAt")).toLocaleString('pt-BR'),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/habilitations/${user.uid}`}>
            <Eye className="mr-2 h-4 w-4" />Revisar Documentos
          </Link>
        </Button>
      );
    },
  },
];
