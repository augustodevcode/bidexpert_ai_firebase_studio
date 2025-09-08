// src/app/admin/cities/new/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import CityForm from '../city-form';
import { createCity, type CityFormData } from '../actions';
import { getStates } from '@/app/admin/states/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Building, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { StateInfo } from '@bidexpert/core';

function NewCityPageContent({ states }: { states: StateInfo[] }) {
  const router = useRouter();
  const { toast } = useToast();

  async function handleCreate(data: CityFormData) {
    const result = await createCity(data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Cidade criada com sucesso.' });
      router.push('/admin/cities');
    } else {
      toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
    }
    return result;
  }

  return (
    <FormPageLayout
      pageTitle="Nova Cidade"
      pageDescription="Preencha os detalhes para cadastrar uma nova cidade."
      icon={Building}
      isEdit={false}
    >
      {(formRef) => (
        <CityForm
          ref={formRef}
          states={states}
          onSubmitAction={handleCreate}
        />
      )}
    </FormPageLayout>
  );
}

export default function NewCityPage() {
  const [states, setStates] = useState<StateInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStates().then(data => {
      setStates(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>;
  }

  return <NewCityPageContent states={states} />;
}
