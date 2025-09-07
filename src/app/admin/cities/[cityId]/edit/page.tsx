// src/app/admin/cities/[cityId]/edit/page.tsx
'use client';

import CityForm from '../../city-form';
import { getCity, updateCity, deleteCity, type CityFormData } from '../../actions';
import { getStates } from '@/app/admin/states/actions'; 
import { notFound, useRouter, useParams } from 'next/navigation';
import FormPageLayout from '@/components/admin/form-page-layout';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Building } from 'lucide-react';
import type { CityInfo, StateInfo } from '@/types';

export default function EditCityPage() {
  const params = useParams();
  const cityId = params.cityId as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [city, setCity] = useState<CityInfo | null>(null);
  const [states, setStates] = useState<StateInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);
  const formRef = useRef<any>(null);

  const fetchPageData = useCallback(async () => {
    if (!cityId) return;
    setIsLoading(true);
    try {
        const [fetchedCity, fetchedStates] = await Promise.all([
            getCity(cityId),
            getStates()
        ]);
        if (!fetchedCity) {
            notFound();
            return;
        }
        setCity(fetchedCity);
        setStates(fetchedStates);
    } catch(e) {
        console.error("Failed to fetch city data", e);
        toast({title: "Erro", description: "Falha ao buscar dados da cidade.", variant: "destructive"})
    }
    setIsLoading(false);
  }, [cityId, toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  
  const handleFormSubmit = async (data: CityFormData) => {
    setIsSubmitting(true);
    const result = await updateCity(cityId, data);
    if (result.success) {
        toast({ title: 'Sucesso!', description: 'Cidade atualizada.' });
        fetchPageData();
        setIsViewMode(true);
    } else {
        toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    const result = await deleteCity(cityId);
     if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/cities');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  }

  const handleSave = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <FormPageLayout
        formTitle={isViewMode ? "Visualizar Cidade" : "Editar Cidade"}
        formDescription={city?.name || 'Carregando...'}
        icon={Building}
        isViewMode={isViewMode}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        onEnterEditMode={() => setIsViewMode(false)}
        onCancel={() => setIsViewMode(true)}
        onSave={handleSave}
        onDelete={handleDelete}
    >
        <CityForm
            ref={formRef}
            initialData={city}
            states={states}
            onSubmitAction={handleFormSubmit}
        />
    </FormPageLayout>
  );
}
