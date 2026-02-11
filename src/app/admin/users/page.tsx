// src/app/admin/users/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Usuários.
 * Utiliza o componente BidExpertSearchResultsFrame para exibir os dados, permitindo
 * busca, filtros por perfil e habilitação, e ações de CRUD.
 */
'use client';



import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUsersWithRoles, deleteUser, createUser, updateUserRoles } from './actions';
import type { UserProfileWithPermissions, Role, PlatformSettings, UserCreationData } from '@/types';
import { PlusCircle, Users as UsersIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getRoles } from '../roles/actions';
import { getUserHabilitationStatusInfo } from '@/lib/ui-helpers';
import { createColumns } from './columns';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { Skeleton } from '@/components/ui/skeleton';
import BidExpertCard from '@/components/BidExpertCard';
import BidExpertListItem from '@/components/BidExpertListItem';
import CrudFormContainer from '@/components/admin/CrudFormContainer';
import UserForm from './user-form';
import UserRoleForm from './user-role-form';
import { applyShadowBan, removeShadowBan } from '@/services/shadow-ban.service';

const sortOptions = [
  { value: 'createdAt_desc', label: 'Mais Recentes' },
  { value: 'fullName_asc', label: 'Nome A-Z' },
  { value: 'fullName_desc', label: 'Nome Z-A' },
];

type ModalState = 
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; user: UserProfileWithPermissions }
  | { mode: 'assign_roles'; user: UserProfileWithPermissions };


export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfileWithPermissions[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [modalState, setModalState] = useState<ModalState>({ mode: 'closed' });

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedUsers, fetchedRoles, settings] = await Promise.all([
          getUsersWithRoles(),
          getRoles(),
          getPlatformSettings(),
      ]);
      setUsers(fetchedUsers);
      setRoles(fetchedRoles);
      setPlatformSettings(settings as PlatformSettings);
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
  }, [fetchPageData, refetchTrigger]);
  
  const onUpdate = useCallback(() => setRefetchTrigger(c => c + 1), []);
  const handleNewClick = () => setModalState({ mode: 'create' });
  const handleEditClick = (user: UserProfileWithPermissions) => setModalState({ mode: 'edit', user });
  const handleRolesClick = (user: UserProfileWithPermissions) => setModalState({ mode: 'assign_roles', user });
  
  const handleFormSuccess = () => {
      setModalState({ mode: 'closed' });
      onUpdate();
  };

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteUser(id);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      onUpdate();
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }, [toast, onUpdate]);

  const handleDeleteSelected = useCallback(async (selectedItems: UserProfileWithPermissions[]) => {
      for (const item of selectedItems) {
        await deleteUser(item.id);
      }
      toast({ title: "Sucesso!", description: `${selectedItems.length} usuário(s) excluído(s).` });
      onUpdate();
  }, [onUpdate, toast]);

  const handleShadowBan = useCallback(async (userId: string, applyBan: boolean) => {
    try {
      if (applyBan) {
        const result = await applyShadowBan(userId, 'MANUAL_FLAG', 'admin', 'Aplicado via admin panel');
        toast({ 
          title: result.success ? 'Shadow Ban Aplicado' : 'Erro',
          description: result.message,
          variant: result.success ? 'default' : 'destructive'
        });
      } else {
        const result = await removeShadowBan(userId, 'admin');
        toast({ 
          title: result.success ? 'Shadow Ban Removido' : 'Erro',
          description: result.message,
          variant: result.success ? 'default' : 'destructive'
        });
      }
      onUpdate();
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao processar shadow ban', variant: 'destructive' });
    }
  }, [toast, onUpdate]);
  
  const columns = useMemo(() => createColumns({ handleDelete, handleShadowBan, onEdit: handleEditClick, onAssignRoles: handleRolesClick }), [handleDelete, handleShadowBan, handleEditClick, handleRolesClick]);
  const renderGridItem = (item: UserProfileWithPermissions) => <BidExpertCard item={item} type="user" platformSettings={platformSettings!} onUpdate={onUpdate} />;
  const renderListItem = (item: UserProfileWithPermissions) => <BidExpertListItem item={item} type="user" platformSettings={platformSettings!} onUpdate={onUpdate} />;

  const roleOptions = useMemo(() => roles.map(role => ({ value: role.name, label: role.name })), [roles]);
  const habilitationOptions = useMemo(() => 
    [...new Set(users.map(u => u.habilitationStatus))].filter(Boolean).map(status => ({ value: status!, label: getUserHabilitationStatusInfo(status).text })), [users]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'roleNames', title: 'Perfil', options: roleOptions },
    { id: 'habilitationStatus', title: 'Habilitação', options: habilitationOptions },
  ], [roleOptions, habilitationOptions]);

  if (error) {
    return (
        <div className="space-y-6" data-ai-id="admin-users-error">
            <Card className="shadow-lg max-w-md mx-auto mt-10">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <UsersIcon className="h-6 w-6" />
                        Erro ao Carregar Usuários
                    </CardTitle>
                    <CardDescription>Não foi possível carregar a lista de usuários.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 bg-destructive/10 rounded-md text-sm text-destructive">
                        {error}
                    </div>
                    <Button onClick={() => fetchPageData()} className="w-full" data-ai-id="users-retry-btn">
                        <Loader2 className="mr-2 h-4 w-4" />
                        Tentar Novamente
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (isLoading || !platformSettings) {
    return (
        <div className="space-y-6">
            <Card className="shadow-lg"><CardHeader className="flex flex-row items-center justify-between"><div><Skeleton className="h-8 w-64 mb-2"/><Skeleton className="h-4 w-80"/></div><Skeleton className="h-10 w-36"/></CardHeader><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card>
        </div>
    );
  }

  return (
    <>
      <div className="space-y-6" data-ai-id="admin-users-page-container">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="text-2xl font-bold font-headline flex items-center"><UsersIcon className="h-6 w-6 mr-2 text-primary" />Gerenciar Usuários</CardTitle><CardDescription>Adicione, edite, ou remova usuários e gerencie seus perfis e habilitações.</CardDescription></div>
            <Button onClick={handleNewClick}><PlusCircle className="mr-2 h-4 w-4" /> Novo Usuário</Button>
          </CardHeader>
        </Card>
        <BidExpertSearchResultsFrame
          items={users} totalItemsCount={users.length} renderGridItem={renderGridItem} renderListItem={renderListItem} dataTableColumns={columns}
          sortOptions={sortOptions} initialSortBy="createdAt_desc" onSortChange={() => {}} platformSettings={platformSettings} isLoading={isLoading}
          searchTypeLabel="usuários" emptyStateMessage="Nenhum usuário encontrado." facetedFilterColumns={facetedFilterColumns}
          searchColumnId="email" searchPlaceholder="Buscar por email ou nome..." onDeleteSelected={handleDeleteSelected}
        />
      </div>

      <CrudFormContainer
        isOpen={modalState.mode === 'create' || modalState.mode === 'edit'}
        onClose={() => setModalState({ mode: 'closed' })}
        mode={platformSettings?.crudFormMode || 'sheet'}
        title={modalState.mode === 'edit' ? 'Editar Usuário' : 'Novo Usuário'}
        description={modalState.mode === 'edit' ? `Modificando o perfil de ${modalState.user.fullName || modalState.user.email}` : 'Cadastre um novo usuário na plataforma.'}
      >
        <UserForm
          initialData={modalState.mode === 'edit' ? modalState.user : null}
          roles={roles}
          onSubmitAction={(data) => modalState.mode === 'edit' ? updateUserRoles(modalState.user.id, data.roleIds || []) : createUser(data as UserCreationData)}
          onSuccess={handleFormSuccess}
          onCancel={() => setModalState({ mode: 'closed' })}
        />
      </CrudFormContainer>
      
      {modalState.mode === 'assign_roles' && (
         <CrudFormContainer
            isOpen={true}
            onClose={() => setModalState({ mode: 'closed' })}
            mode="modal"
            title={`Atribuir Perfis para ${modalState.user.fullName}`}
            description="Selecione os perfis que este usuário terá."
         >
            <UserRoleForm
                user={modalState.user}
                roles={roles}
                onSubmitAction={updateUserRoles}
                onSuccess={handleFormSuccess}
                onCancel={() => setModalState({ mode: 'closed' })}
            />
         </CrudFormContainer>
      )}
    </>
  );
}
