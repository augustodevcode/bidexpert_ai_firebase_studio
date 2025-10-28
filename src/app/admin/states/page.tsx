// src/app/admin/states/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Estados.
 * Utiliza o componente DataTable para exibir os estados de forma interativa,
 * permitindo busca, ordenação e ações como edição e exclusão.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getStates, deleteState, createState, updateState } from './actions';
import type { StateInfo, PlatformSettings, StateFormData } from '@/types';
import { PlusCircle, Map, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import { createColumns } from './columns';
import { useRouter } from 'next/navigation';
import { getPlatformSettings } from '../settings/actions';
import { Skeleton } from '@/components/ui/skeleton';
import CrudFormContainer from '@/components/admin/CrudFormContainer';
import StateForm from './state-form';

export default function AdminStatesPage() {
  const [states, setStates] = useState<StateInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingState, setEditingState] = useState<StateInfo | null>(null);

  const fetchPageData = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [fetchedStates, settings] = await Promise.all([
          getStates(),
          getPlatformSettings(),
        ]);
        setStates(fetchedStates);
        setPlatformSettings(settings as PlatformSettings);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Falha ao buscar estados.";
        console.error("Error fetching states:", e);
        setError(errorMessage);
        toast({ title: "Erro", description: errorMessage, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
  }, [toast]);
  
  useEffect(() => {
    fetchPageData();
  }, [refetchTrigger, fetchPageData]);

  const onUpdate = useCallback(() => setRefetchTrigger(c => c + 1), []);
  const handleNewClick = () => { setEditingState(null); setIsFormOpen(true); };
  const handleEditClick = (state: StateInfo) => { setEditingState(state); setIsFormOpen(true); };
  const handleFormSuccess = () => { setIsFormOpen(false); setEditingState(null); onUpdate(); };
  
  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteState(id);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      onUpdate();
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  }, [toast, onUpdate]);
  
  const handleDeleteSelected = useCallback(async (selectedItems: StateInfo[]) => {
    if (selectedItems.length === 0) return;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of selectedItems) {
      const result = await deleteState(item.id);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast({ title: `Erro ao excluir ${item.name}`, description: result.message, variant: "destructive", duration: 5000 });
      }
    }

    if (successCount > 0) {
      toast({ title: "Exclusão em Massa Concluída", description: `${successCount} estado(s) excluído(s) com sucesso.` });
    }
    onUpdate();
  }, [onUpdate, toast]);

  const columns = useMemo(() => createColumns({ handleDelete, onEdit: handleEditClick }), [handleDelete]);
  
  const formAction = async (data: StateFormData) => {
    if (editingState) {
      return updateState(editingState.id, data);
    }
    return createState(data);
  };

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
    <>
      <div className="space-y-6" data-ai-id="admin-states-page-container">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <Map className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Estados
              </CardTitle>
              <CardDescription>
                Adicione, edite ou remova estados (UFs) da plataforma.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                  <Link href="/admin/states/analysis">
                      <BarChart3 className="mr-2 h-4 w-4" /> Ver Análise
                  </Link>
              </Button>
              <Button onClick={handleNewClick}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Novo Estado
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <BidExpertSearchResultsFrame
                  items={states}
                  dataTableColumns={columns}
                  onSortChange={() => {}}
                  platformSettings={platformSettings}
                  isLoading={isLoading}
                  searchTypeLabel="estados"
                  searchColumnId="name"
                  searchPlaceholder="Buscar por nome ou UF..."
                  onDeleteSelected={handleDeleteSelected as any}
                  sortOptions={[{ value: 'name', label: 'Nome' }]}
              />
          </CardContent>
        </Card>
      </div>
      <CrudFormContainer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        mode={platformSettings?.crudFormMode || 'modal'}
        title={editingState ? 'Editar Estado' : 'Novo Estado'}
        description={editingState ? 'Modifique os detalhes do estado.' : 'Cadastre um novo estado.'}
      >
          <StateForm
              initialData={editingState}
              onSubmitAction={formAction}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
          />
      </CrudFormContainer>
    </>
  );
}
