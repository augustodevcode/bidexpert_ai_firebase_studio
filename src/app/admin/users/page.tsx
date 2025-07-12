
// src/app/admin/users/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUsersWithRoles } from './actions';
import type { UserProfileData, Role } from '@/types';
import { PlusCircle, Users as UsersIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { getRoles } from '../roles/actions';
import { getUserHabilitationStatusInfo } from '@/lib/sample-data-helpers';


export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfileData[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const fetchUsers = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      try {
        const [fetchedUsers, fetchedRoles] = await Promise.all([
            getUsersWithRoles(),
            getRoles()
        ]);
        if (isMounted) {
          setUsers(fetchedUsers);
          setRoles(fetchedRoles);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Falha ao buscar usuários.";
        console.error("Error fetching users:", e);
        if (isMounted) {
          setError(errorMessage);
          toast({ title: "Erro", description: errorMessage, variant: "destructive" });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [toast, refetchTrigger]);

  const handleDelete = useCallback(
    async (id: string) => {
      // Deletion logic would go here, for now it's a placeholder
      toast({ title: "Ação Desativada", description: "A exclusão de usuários não está implementada nesta demonstração." });
    },
    [toast]
  );
  
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
    { id: 'roleName', title: 'Perfil', options: roleOptions },
    { id: 'habilitationStatus', title: 'Habilitação', options: habilitationOptions },
  ], [roleOptions, habilitationOptions]);


  return (
    <div className="space-y-6">
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
          />
        </CardContent>
      </Card>
    </div>
  );
}


