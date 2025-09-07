// src/app/admin/vehicle-makes/[makeId]/edit/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import VehicleMakeForm from '../../vehicle-make-form';
import { getVehicleMake, updateVehicleMake, deleteVehicleMake, type VehicleMakeFormData } from '../../actions';
import { notFound, useRouter, useParams } from 'next/navigation';
import FormPageLayout from '@/components/admin/form-page-layout';
import { useToast } from '@/hooks/use-toast';
import { Car } from 'lucide-react';
import type { VehicleMake } from '@/types';

export default function EditVehicleMakePage() {
  const params = useParams();
  const makeId = params.makeId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [make, setMake] = useState<VehicleMake | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);
  const formRef = useRef<any>(null);

  const fetchPageData = useCallback(async () => {
    if (!makeId) return;
    setIsLoading(true);
    try {
      const fetchedMake = await getVehicleMake(makeId);
      if (!fetchedMake) {
        notFound();
        return;
      }
      setMake(fetchedMake);
    } catch (e) {
      console.error("Failed to fetch vehicle make", e);
      toast({ title: "Erro", description: "Falha ao buscar dados da marca.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [makeId, toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleFormSubmit = async (data: VehicleMakeFormData) => {
    setIsSubmitting(true);
    const result = await updateVehicleMake(makeId, data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Marca atualizada.' });
      fetchPageData();
      setIsViewMode(true);
    } else {
      toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    const result = await deleteVehicleMake(makeId);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/vehicle-makes');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  };

  const handleSave = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <FormPageLayout
      formTitle={isViewMode ? "Visualizar Marca" : "Editar Marca"}
      formDescription={make?.name || 'Carregando...'}
      icon={Car}
      isViewMode={isViewMode}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onEnterEditMode={() => setIsViewMode(false)}
      onCancel={() => setIsViewMode(true)}
      onSave={handleSave}
      onDelete={handleDelete}
    >
      <VehicleMakeForm
        ref={formRef}
        initialData={make}
        onSubmitAction={handleFormSubmit}
      />
    </FormPageLayout>
  );
}
