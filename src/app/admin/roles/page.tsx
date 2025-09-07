// src/app/admin/roles/page.tsx
import { PlusCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { getRoles, deleteRole } from './actions';
import { createColumns } from './columns';
import type { Role } from '@/types';

const PROTECTED_ROLES_NORMALIZED = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTION_ANALYST', 'BIDDER'];

export default function AdminRolesPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <ShieldCheck className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Perfis de Usuário
            </CardTitle>
            <CardDescription>
              Crie, edite ou remova perfis (roles) para controlar o acesso na plataforma.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/roles/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Perfil
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ResourceDataTable<Role>
            columns={createColumns}
            fetchAction={getRoles}
            deleteAction={deleteRole}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome do perfil..."
            deleteConfirmation={(item) => !PROTECTED_ROLES_NORMALIZED.includes(item.nameNormalized)}
            deleteConfirmationMessage={(item) => `O perfil "${item.name}" é protegido e não pode ser excluído.`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
