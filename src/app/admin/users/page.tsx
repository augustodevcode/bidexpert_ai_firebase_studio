// src/app/admin/users/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUsersWithRoles, deleteUser } from './actions';
import type { UserProfileData } from '@/types';
import { PlusCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { getUserHabilitationStatusInfo } from '@/lib/sample-data-helpers';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedUsers = await getUsersWithRoles();
      setUsers(fetchedUsers);
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
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteUser(id);
      if (result.success) {
        toast({ title: "Sucesso!", description: result.message });
        fetchUsers();
      } else {
        toast({ title: 'Erro ao Excluir', description: result.message, variant: 'destructive' });
      }
    },
    [fetchUsers, toast]
  );
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);
  
  const habilitationStatusOptions = useMemo(() => 
    [...new Set(users.map(u => u.habilitationStatus))]
      .filter(Boolean)
      .map(status => ({ value: status!, label: getUserHabilitationStatusInfo(status).text })),
  [users]);

  const roleOptions = useMemo(() => 
    [...new Set(users.map(u => u.roleName))]
      .filter(Boolean)
      .map(roleName => ({ value: roleName!, label: roleName! })),
  [users]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Users className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Usuários da Plataforma
            </CardTitle>
            <CardDescription>
              Visualize usuários, atribua perfis e gerencie o acesso.
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
            searchColumnId="fullName"
            searchPlaceholder="Buscar por nome ou email..."
            facetedFilterColumns={[
              { id: 'roleName', title: 'Perfil', options: roleOptions },
              { id: 'habilitationStatus', title: 'Habilitação', options: habilitationStatusOptions },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
