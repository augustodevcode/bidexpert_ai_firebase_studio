// src/app/admin/states/new/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { StateForm } from '../components/state-form';
import { createState, type StateFormData } from '../actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NewStatePage() {
  const router = useRouter();
  const { toast } = useToast();
  
  async function handleCreateState(data: StateFormData) {
    const result = await createState(data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Estado criado.' });
      router.push('/admin/states');
    } else {
      toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
    }
    return result;
  }

  return (
    <FormPageLayout
        pageTitle="Novo Estado"
        pageDescription="Preencha os detalhes para cadastrar um novo estado."
        icon={MapPin}
        isEdit={false}
    >
        {(formRef) => (
            <StateForm
                ref={formRef}
                onSubmitAction={handleCreateState}
            />
        )}
    </FormPageLayout>
  );
}
