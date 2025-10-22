// src/app/admin/courts/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Tribunais.
 * Utiliza o componente DataTable para exibir os dados de forma interativa,
 * permitindo busca, ordenação e ações como exclusão em massa e individual.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCourts, deleteCourt, createCourt, updateCourt } from '@/app/admin/courts/actions';
import type { Court, PlatformSettings, CourtFormData, StateInfo } from '@/types';
import { PlusCircle, Scale } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import { createColumns } from '@/app/admin/courts/columns';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { getStates } from '@/app/admin/states/actions';
import { Skeleton } from '@/components/ui/skeleton';
import CrudFormContainer from '@/components/admin/CrudFormContainer';
import CourtForm from '@/app/admin/courts/court-form';

export default function AdminCourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [dependencies, setDependencies] = useState<{ states: StateInfo[] } | null>(null);


  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedItems, settings, states] = await Promise.all([
        getCourts(),
        getPlatformSettings(),
        getStates(),
      ]);
      setCourts(fetchedItems);
      setPlatformSettings(settings as PlatformSettings);
      setDependencies({ states });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar tribunais.";
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
  const handleNewClick = () => { setEditingCourt(null); setIsFormOpen(true); };
  const handleEditClick = (court: Court) => { setEditingCourt(court); setIsFormOpen(true); };
  const handleFormSuccess = () => { setIsFormOpen(false); setEditingCourt(null); onUpdate(); };

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteCourt(id);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      onUpdate();
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }, [toast, onUpdate]);

  const handleDeleteSelected = useCallback(async (selectedItems: Court[]) => {
    if (selectedItems.length === 0) return;
    for (const item of selectedItems) {
      await deleteCourt(item.id);
    }
    toast({ title: "Exclusão em Massa Concluída", description: `${selectedItems.length} tribunal(s) excluído(s) com sucesso.` });
    onUpdate();
  }, [onUpdate, toast]);
  
  const columns = useMemo(() => createColumns({ handleDelete, onEdit: handleEditClick }), [handleDelete]);

  const formAction = async (data: CourtFormData) => {
    if (editingCourt) {
      return updateCourt(editingCourt.id, data);
    }
    return createCourt(data);
  };

  if (isLoading || !platformSettings || !dependencies) {
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
      <div className="space-y-6" data-ai-id="admin-courts-page-container">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <Scale className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Tribunais de Justiça
              </CardTitle>
              <CardDescription>
                Adicione, edite ou remova os tribunais de justiça.
              </CardDescription>
            </div>
            <Button onClick={handleNewClick}>
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Tribunal
            </Button>
          </CardHeader>
          <CardContent>
            <BidExpertSearchResultsFrame
                  items={courts}
                  dataTableColumns={columns}
                  onSortChange={() => {}}
                  platformSettings={platformSettings}
                  isLoading={isLoading}
                  searchTypeLabel="tribunais"
                  searchColumnId="name"
                  searchPlaceholder="Buscar por nome..."
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
          title={editingCourt ? 'Editar Tribunal' : 'Novo Tribunal'}
          description={editingCourt ? 'Modifique os detalhes do tribunal.' : 'Cadastre um novo tribunal de justiça.'}
      >
          <CourtForm
              initialData={editingCourt}
              states={dependencies.states}
              onSubmitAction={formAction}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
          />
      </CrudFormContainer>
    </>
  );
}
