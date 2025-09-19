// src/app/admin/tenants/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Tenant } from '@prisma/client';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Globe, Users } from 'lucide-react';
import Link from 'next/link';

export const createColumns = (): ColumnDef<Tenant>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome do Tenant" />,
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "subdomain",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Subdomínio" />,
    cell: ({ row }) => {
        const subdomain = row.getValue("subdomain") as string;
        const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:9002';
        return (
            <Link href={`http://${subdomain}.${appDomain}`} target="_blank" className="flex items-center gap-1 text-primary hover:underline">
                <Globe className="h-3 w-3"/>
                {subdomain}
            </Link>
        )
    }
  },
   {
    id: 'userCount',
    accessorFn: row => (row as any)._count?.users || 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Usuários" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("userCount")}</div>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Data de Criação" />,
    cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString('pt-BR'),
  },
];
