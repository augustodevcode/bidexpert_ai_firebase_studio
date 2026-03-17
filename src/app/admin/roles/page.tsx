// src/app/admin/roles/page.tsx
/**
 * @fileoverview PÃ¡gina principal para listagem e gerenciamento de Perfis de UsuÃ¡rio (Roles).
 * Utiliza o componente BidExpertSearchResultsFrame para exibir os perfis de forma interativa,
 * permitindo busca, ordenaÃ§Ã£o e aÃ§Ãµes de ediÃ§Ã£o e exclusÃ£o. Protege perfis essenciais
 * do sistema contra exclusÃ£o para manter a integridade da plataforma.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getRoles, deleteRole, createRole, updateRole } from './actions';
import type { Role, PlatformSettings } from '@/types';
import { PlusCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createColumns } from './columns';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { Skeleton } from '@/components/ui/skeleton';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import CrudFormContainer from '@/components/admin/CrudFormContainer';
import { RoleForm } from './role-form';
import type { RoleFormValues } from './role-form-schema';

const PROTECTED_ROLES_NORMALIZED = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTION_ANALYST', 'BIDDER', 'TENANT_ADMIN'];

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    isEditing: boolean;
    data: Role | null;
  }>({
    isOpen: false,
    isEditing: false,
    data: null
  });

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
        toast({ title: "Ação não permitida", description: `O perfil "${item.name}" é protegido e não pode ser excluído.`, variant: "destructive", duration: 5000 });
        errorCount++;
        continue;
      }
      const result = await deleteRole(item.id);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast({ title: `Erro ao excluir "${item.name}"`, description: result.message, variant: "destructive", duration: 5000 });
      }
    }

    if (successCount > 0) {
      toast({ title: "Exclusão em massa concluída", description: `${successCount} perfil(is) excluído(s) com sucesso.` });
    }
    fetchPageData();
  }, [toast, fetchPageData]);

  const handleEdit = useCallback((role: Role) => {
    setModalState({
      isOpen: true,
      isEditing: true,
      data: role
    });
  }, []);

  const handleCreateNew = () => {
    setModalState({
      isOpen: true,
      isEditing: false,
      data: null
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleSubmit = async (data: RoleFormValues) => {
    try {
      if (modalState.isEditing && modalState.data) {
        return await updateRole(modalState.data.id, data);
      } else {
        return await createRole(data);
      }
    } catch (error) {
      console.error("Submit error:", error);
      return { success: false, message: "Erro inesperado ao salvar." };
    }
  };

  const handleSuccess = () => {
    closeModal();
    setRefetchTrigger(prev => prev + 1);
  };

  const columns = useMemo(() => createColumns({ handleDelete, handleEdit }), [handleDelete, handleEdit]);

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
          <Button onClick={handleCreateNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Perfil
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

      <CrudFormContainer
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.isEditing ? "Editar Perfil" : "Novo Perfil"}
        description={modalState.isEditing ? "Edite os dados do perfil abaixo." : "Preencha os dados do novo perfil."}
        mode={platformSettings?.crudFormMode || 'modal'}
      >
        <RoleForm
          initialData={modalState.data}
          onSubmitAction={handleSubmit}
          formTitle="" // Removing title from inner form to avoid duplication
          formDescription="" // Removing description from inner form
          submitButtonText={modalState.isEditing ? "Salvar Alterações" : "Criar Perfil"}
          onSuccess={handleSuccess}
        />
      </CrudFormContainer>
    </div>
  );
}
