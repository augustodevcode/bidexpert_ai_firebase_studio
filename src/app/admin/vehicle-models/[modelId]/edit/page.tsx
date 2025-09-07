// src/app/admin/vehicle-models/[modelId]/edit/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import VehicleModelForm from '../../vehicle-model-form';
import { getVehicleModel, updateVehicleModel, deleteVehicleModel, type VehicleModelFormData } from '../../actions';
import { getVehicleMakes } from '@/app/admin/vehicle-makes/actions';
import { notFound, useRouter, useParams } from 'next/navigation';
import FormPageLayout from '@/components/admin/form-page-layout';
import { useToast } from '@/hooks/use-toast';
import { Car } from 'lucide-react';
import type { VehicleModel, VehicleMake } from '@/types';


export default function EditVehicleModelPage() {
  const params = useParams();
  const modelId = params.modelId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [model, setModel] = useState<VehicleModel | null>(null);
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);
  const formRef = useRef<any>(null);

  const fetchPageData = useCallback(async () => {
    if (!modelId) return;
    setIsLoading(true);
    try {
      const [fetchedModel, fetchedMakes] = await Promise.all([
        getVehicleModel(modelId),
        getVehicleMakes()
      ]);
      
      if (!fetchedModel) {
        notFound();
        return;
      }
      setModel(fetchedModel);
      setMakes(fetchedMakes);
    } catch (e) {
      console.error("Failed to fetch vehicle model data", e);
      toast({ title: "Erro", description: "Falha ao buscar dados do modelo.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [modelId, toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleFormSubmit = async (data: VehicleModelFormData) => {
    setIsSubmitting(true);
    const result = await updateVehicleModel(modelId, data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Modelo atualizado.' });
      fetchPageData();
      setIsViewMode(true);
    } else {
      toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    const result = await deleteVehicleModel(modelId);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/vehicle-models');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  };

  const handleSave = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <FormPageLayout
      formTitle={isViewMode ? "Visualizar Modelo" : "Editar Modelo"}
      formDescription={model?.name || 'Carregando...'}
      icon={Car}
      isViewMode={isViewMode}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onEnterEditMode={() => setIsViewMode(false)}
      onCancel={() => setIsViewMode(true)}
      onSave={handleSave}
      onDelete={handleDelete}
    >
      <VehicleModelForm
        ref={formRef}
        initialData={model}
        makes={makes}
        onSubmitAction={handleFormSubmit}
      />
    </FormPageLayout>
  );
}
