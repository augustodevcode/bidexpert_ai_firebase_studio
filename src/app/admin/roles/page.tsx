// src/app/admin/roles/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Perfis de Usuário (Roles).
 * Utiliza o componente BidExpertSearchResultsFrame para exibir os perfis de forma interativa,
 * permitindo busca, ordenação e ações de edição e exclusão. Protege perfis essenciais
 * do sistema contra exclusão para manter a integridade da plataforma.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getRoles, deleteRole } from './actions';
import type { Role, PlatformSettings } from '@/types';
import { PlusCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createColumns } from './columns';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { Skeleton } from '@/components/ui/skeleton';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';

const PROTECTED_ROLES_NORMALIZED = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTION_ANALYST', 'BIDDER', 'TENANT_ADMIN'];

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedRoles, settings] = await Promise.all([
          getRoles(),
          getPlatformSettings()
      ]);
      setRoles(fetchedRoles);
      setPlatformSettings(settings as PlatformSettings);
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
    fetchPageData();
  }, [refetchTrigger, fetchPageData]);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteRole(id);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      setRefetchTrigger(c => c + 1);
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  }, [toast]);

  const handleDeleteSelected = useCallback(async (selectedItems: Role[]) => {
    if (selectedItems.length === 0) return;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of selectedItems) {
      if (PROTECTED_ROLES_NORMALIZED.includes(item.nameNormalized)) {
        toast({ title: `Ação não Permitida`, description: `O perfil "${item.name}" é protegido e não pode ser excluído.`, variant: "destructive", duration: 5000 });
        errorCount++;
        continue;
      }
      const result = await deleteRole(item.id);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast({ title: `Erro ao excluir ${item.name}`, description: result.message, variant: "destructive", duration: 5000 });
      }
    }

    if (successCount > 0) {
      toast({ title: "Exclusão em Massa Concluída", description: `${successCount} perfil(s) excluído(s) com sucesso.` });
    }
    fetchPageData();
  }, [toast, fetchPageData]);
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  if (isLoading || !platformSettings) {
    return (
      <div className="space-y-6">
          <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                  <div><Skeleton className="h-8 w-64 mb-2"/><Skeleton className="h-4 w-80"/></div>
                  <Skeleton className="h-10 w-36"/>
              </CardHeader>
              <CardContent><Skeleton className="h-96 w-full" /></CardContent>
          </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ai-id="admin-roles-page-container">
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
           <BidExpertSearchResultsFrame
              items={roles}
              totalItemsCount={roles.length}
              dataTableColumns={columns}
              onSortChange={() => {}}
              platformSettings={platformSettings}
              isLoading={isLoading}
              searchTypeLabel="perfis"
              searchColumnId="name"
              searchPlaceholder="Buscar por nome do perfil..."
              onDeleteSelected={handleDeleteSelected}
              sortOptions={[{ value: 'name', label: 'Nome' }]}
            />
        </CardContent>
      </Card>
    </div>
  );
}
