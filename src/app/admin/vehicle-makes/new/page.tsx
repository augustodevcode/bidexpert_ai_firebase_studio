// src/app/admin/vehicle-makes/new/page.tsx
'use client';

import React from 'react';
import VehicleMakeForm from '../vehicle-make-form';
import { createVehicleMake, type VehicleMakeFormData } from '../actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Car } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';


export default function NewVehicleMakePage() {
  const router = useRouter();
  const { toast } = useToast();
  
  async function handleCreate(data: VehicleMakeFormData) {
    const result = await createVehicleMake(data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Marca criada.' });
      router.push('/admin/vehicle-makes');
    } else {
      toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
    }
    return result;
  }

  return (
    <FormPageLayout
      pageTitle="Nova Marca de Veículo"
      pageDescription="Cadastre uma nova marca de veículo no sistema."
      icon={Car}
      isEdit={false}
    >
      {(formRef) => (
         <VehicleMakeForm
          ref={formRef}
          onSubmitAction={handleCreate}
        />
      )}
    </FormPageLayout>
  );
}
