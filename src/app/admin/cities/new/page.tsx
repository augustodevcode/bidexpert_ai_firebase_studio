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
import type { StateInfo } from '@/types';

function NewCityPageContent({ states }: { states: StateInfo[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = () => {
    formRef.current?.requestSubmit();
  };

  async function handleCreateCity(data: CityFormData) {
    setIsSubmitting(true);
    const result = await createCity(data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Cidade criada com sucesso.' });
      router.push('/admin/cities');
    } else {
      toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
      setIsSubmitting(false); // Only stop loading on error
    }
  }

  return (
    <FormPageLayout
      formTitle="Nova Cidade"
      formDescription="Preencha os detalhes para cadastrar uma nova cidade."
      icon={Building}
      isViewMode={false} // Always in edit mode for new page
      isSubmitting={isSubmitting}
      onSave={handleSave}
      onCancel={() => router.push('/admin/cities')}
    >
      <CityForm
        ref={formRef}
        states={states}
        onSubmitAction={handleCreateCity}
      />
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
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return <NewCityPageContent states={states} />;
}
