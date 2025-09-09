// src/app/admin/states/[stateId]/edit/page.tsx
'use client';

import { StateForm } from '../components/state-form';
import { getState, updateState, deleteState, type StateFormData } from '../../actions';
import { notFound, useRouter, useParams } from 'next/navigation';
import FormPageLayout from '@/components/admin/form-page-layout';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MapPin } from 'lucide-react';
import type { StateInfo } from '@/types';

export default function EditStatePage() {
  const params = useParams();
  const stateId = params.stateId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [stateData, setStateData] = useState<StateInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);
  const formRef = useRef<any>(null);

  const fetchPageData = useCallback(async () => {
    if (!stateId) return;
    setIsLoading(true);
    try {
        const fetchedState = await getState(stateId);
        if (!fetchedState) {
            notFound();
            return;
        }
        setStateData(fetchedState);
    } catch(e) {
        console.error("Failed to fetch state", e);
        toast({title: "Erro", description: "Falha ao buscar dados do estado.", variant: "destructive"})
    }
    setIsLoading(false);
  }, [stateId, toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  
  const handleFormSubmit = async (data: StateFormData) => {
    setIsSubmitting(true);
    const result = await updateState(stateId, data);
    if (result.success) {
        toast({ title: 'Sucesso!', description: 'Estado atualizado.' });
        fetchPageData();
        setIsViewMode(true);
    } else {
        toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

   const handleDelete = async () => {
    const result = await deleteState(stateId);
     if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/states');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  }

  const handleSave = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <FormPageLayout
        formTitle={isViewMode ? "Visualizar Estado" : "Editar Estado"}
        formDescription={stateData?.name || 'Carregando...'}
        icon={MapPin}
        isViewMode={isViewMode}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        onEnterEditMode={() => setIsViewMode(false)}
        onCancel={() => setIsViewMode(true)}
        onSave={handleSave}
        onDelete={handleDelete}
        deleteConfirmationMessage={(item: any) => `Este estado possui ${item.cityCount || 0} cidade(s) e elas também serão afetadas.`}
        deleteConfirmation={(item: any) => (item.cityCount || 0) === 0}
    >
        <StateForm
            ref={formRef}
            initialData={stateData}
            onSubmitAction={handleFormSubmit}
        />
    </FormPageLayout>
  );
}
