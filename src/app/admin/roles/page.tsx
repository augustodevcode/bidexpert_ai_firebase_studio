// src/app/admin/roles/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getRoles, deleteRole } from './actions';
import type { Role } from '@/types';
import { PlusCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedRoles = await getRoles();
      setRoles(fetchedRoles);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar perfis.";
      console.error("Error fetching roles:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteRole(id);
      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
        fetchRoles();
      } else {
        toast({ title: 'Erro ao Excluir', description: result.message, variant: 'destructive' });
      }
    },
    [fetchRoles, toast]
  );
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

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
          <DataTable
            columns={columns}
            data={roles}
            isLoading={isLoading}
            error={error}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome do perfil..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
