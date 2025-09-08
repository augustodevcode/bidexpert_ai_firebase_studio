// src/app/admin/judicial-districts/[districtId]/edit/page.tsx
'use client';

import JudicialDistrictForm from '../../judicial-district-form';
import { getJudicialDistrict, updateJudicialDistrict, deleteJudicialDistrict } from '../../actions';
import { getStates } from '@/app/admin/states/actions';
import { getCourts } from '@/app/admin/courts/actions';
import { notFound, useRouter, useParams } from 'next/navigation';
import FormPageLayout from '@/components/admin/form-page-layout';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Map } from 'lucide-react';
import type { JudicialDistrict, Court, StateInfo, JudicialDistrictFormData } from '@bidexpert/core';


export default function EditJudicialDistrictPage() {
  const params = useParams();
  const districtId = params.districtId as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [district, setDistrict] = useState<JudicialDistrict | null>(null);
  const [states, setStates] = useState<StateInfo[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);
  const formRef = useRef<any>(null);

  const fetchPageData = useCallback(async () => {
    if (!districtId) return;
    setIsLoading(true);
    try {
        const [fetchedDistrict, fetchedStates, fetchedCourts] = await Promise.all([
            getJudicialDistrict(districtId),
            getStates(),
            getCourts()
        ]);
        if (!fetchedDistrict) {
            notFound();
            return;
        }
        setDistrict(fetchedDistrict);
        setStates(fetchedStates);
        setCourts(fetchedCourts);
    } catch(e) {
        console.error("Failed to fetch district data", e);
        toast({title: "Erro", description: "Falha ao buscar dados da comarca.", variant: "destructive"})
    }
    setIsLoading(false);
  }, [districtId, toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  
  const handleFormSubmit = async (data: JudicialDistrictFormData) => {
    setIsSubmitting(true);
    const result = await updateJudicialDistrict(districtId, data);
    if (result.success) {
        toast({ title: 'Sucesso!', description: 'Comarca atualizada.' });
        fetchPageData();
        setIsViewMode(true);
    } else {
        toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    const result = await deleteJudicialDistrict(districtId);
     if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/judicial-districts');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  }

  const handleSave = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <FormPageLayout
        formTitle={isViewMode ? "Visualizar Comarca" : "Editar Comarca"}
        formDescription={district?.name || 'Carregando...'}
        icon={Map}
        isViewMode={isViewMode}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        onEnterEditMode={() => setIsViewMode(false)}
        onCancel={() => setIsViewMode(true)}
        onSave={handleSave}
        onDelete={handleDelete}
    >
        <JudicialDistrictForm
            ref={formRef}
            initialData={district}
            states={states}
            courts={courts}
            onSubmitAction={handleFormSubmit}
        />
    </FormPageLayout>
  );
}
