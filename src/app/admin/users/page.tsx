// src/app/admin/users/page.tsx
import { PlusCircle, Users as UsersIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { getUsersWithRoles, deleteUser } from './actions';
import { getRoles } from '../roles/actions';
import { createColumns } from './columns';
import type { UserProfileWithPermissions } from '@/types';
import { getUserHabilitationStatusInfo } from '@/lib/ui-helpers';

export default async function AdminUsersPage() {
  // Fetching roles on the server to build the filter options
  const roles = await getRoles();
  const roleOptions = roles.map(role => ({ value: role.name, label: role.name }));

  const habilitationOptions = [
    { value: 'HABILITADO', label: getUserHabilitationStatusInfo('HABILITADO').text },
    { value: 'PENDING_ANALYSIS', label: getUserHabilitationStatusInfo('PENDING_ANALYSIS').text },
    { value: 'PENDING_DOCUMENTS', label: getUserHabilitationStatusInfo('PENDING_DOCUMENTS').text },
    { value: 'REJECTED_DOCUMENTS', label: getUserHabilitationStatusInfo('REJECTED_DOCUMENTS').text },
    { value: 'BLOCKED', label: getUserHabilitationStatusInfo('BLOCKED').text },
  ];

  const facetedFilterColumns = [
    { id: 'roleNames', title: 'Perfil', options: roleOptions },
    { id: 'habilitationStatus', title: 'Habilitação', options: habilitationOptions },
  ];

  return (
    <div className="space-y-6" data-ai-id="admin-users-page-container">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <UsersIcon className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Usuários
            </CardTitle>
            <CardDescription>
              Adicione, edite, ou remova usuários e gerencie seus perfis e habilitações.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/users/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Usuário
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ResourceDataTable<UserProfileWithPermissions>
            columns={createColumns}
            fetchAction={getUsersWithRoles}
            deleteAction={deleteUser}
            searchColumnId="email"
            searchPlaceholder="Buscar por email ou nome..."
            facetedFilterColumns={facetedFilterColumns}
          />
        </CardContent>
      </Card>
    </div>
  );
}
