// src/app/admin/courts/[courtId]/edit/page.tsx
'use client';

import CourtForm from '../../court-form';
import { getCourt, updateCourt, deleteCourt, type CourtFormData } from '../../actions';
import { getStates } from '@/app/admin/states/actions';
import { notFound, useRouter, useParams } from 'next/navigation';
import FormPageLayout from '@/components/admin/form-page-layout';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Scale } from 'lucide-react';
import type { Court, StateInfo } from '@/types';

export default function EditCourtPage() {
  const params = useParams();
  const courtId = params.courtId as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [court, setCourt] = useState<Court | null>(null);
  const [states, setStates] = useState<StateInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);
  const formRef = useRef<any>(null);

  const fetchPageData = useCallback(async () => {
    if (!courtId) return;
    setIsLoading(true);
    try {
        const [fetchedCourt, fetchedStates] = await Promise.all([
            getCourt(courtId),
            getStates(),
        ]);
        if (!fetchedCourt) {
            notFound();
            return;
        }
        setCourt(fetchedCourt);
        setStates(fetchedStates);
    } catch(e) {
        console.error("Failed to fetch court data", e);
        toast({title: "Erro", description: "Falha ao buscar dados do tribunal.", variant: "destructive"})
    }
    setIsLoading(false);
  }, [courtId, toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  
  const handleFormSubmit = async (data: CourtFormData) => {
    setIsSubmitting(true);
    const result = await updateCourt(courtId, data);
    if (result.success) {
        toast({ title: 'Sucesso!', description: 'Tribunal atualizado.' });
        fetchPageData();
        setIsViewMode(true);
    } else {
        toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    const result = await deleteCourt(courtId);
     if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/courts');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  }

  const handleSave = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <FormPageLayout
        formTitle={isViewMode ? "Visualizar Tribunal" : "Editar Tribunal"}
        formDescription={court?.name || 'Carregando...'}
        icon={Scale}
        isViewMode={isViewMode}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        onEnterEditMode={() => setIsViewMode(false)}
        onCancel={() => setIsViewMode(true)}
        onSave={handleSave}
        onDelete={handleDelete}
    >
        <CourtForm
            ref={formRef}
            initialData={court}
            states={states}
            onSubmitAction={handleFormSubmit}
        />
    </FormPageLayout>
  );
}
