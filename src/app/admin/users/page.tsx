// src/app/admin/users/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUsersWithRoles, deleteUser } from './actions';
import type { UserProfileWithPermissions, Role } from '@/types';
import { PlusCircle, Users as UsersIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { getRoles } from '../roles/actions';
import { getUserHabilitationStatusInfo } from '@/lib/ui-helpers';


export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfileWithPermissions[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedUsers, fetchedRoles] = await Promise.all([
          getUsersWithRoles(),
          getRoles()
      ]);
      setUsers(fetchedUsers);
      setRoles(fetchedRoles);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar usuários.";
      console.error("Error fetching users:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchPageData();
  }, [refetchTrigger, fetchPageData]);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteUser(id);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      fetchPageData();
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }, [toast, fetchPageData]);

  const handleDeleteSelected = useCallback(async (selectedItems: UserProfileWithPermissions[]) => {
    if (selectedItems.length === 0) return;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of selectedItems) {
      const result = await deleteUser(item.id);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast({ title: `Erro ao excluir ${item.fullName || item.email}`, description: result.message, variant: "destructive", duration: 5000 });
      }
    }

    if (successCount > 0) {
      toast({ title: "Exclusão em Massa Concluída", description: `${successCount} usuário(s) excluído(s) com sucesso.` });
    }
    fetchPageData();
  }, [toast, fetchPageData]);
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  const roleOptions = useMemo(() => 
    roles.map(role => ({ value: role.name, label: role.name })),
  [roles]);
  
  const habilitationOptions = useMemo(() => 
    [...new Set(users.map(u => u.habilitationStatus))]
      .filter(Boolean)
      .map(status => ({ value: status!, label: getUserHabilitationStatusInfo(status).text })),
  [users]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'roleNames', title: 'Perfil', options: roleOptions },
    { id: 'habilitationStatus', title: 'Habilitação', options: habilitationOptions },
  ], [roleOptions, habilitationOptions]);


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
          <DataTable
            columns={columns}
            data={users}
            isLoading={isLoading}
            error={error}
            searchColumnId="email"
            searchPlaceholder="Buscar por email ou nome..."
            facetedFilterColumns={facetedFilterColumns}
            onDeleteSelected={handleDeleteSelected}
          />
        </CardContent>
      </Card>
    </div>
  );
}
