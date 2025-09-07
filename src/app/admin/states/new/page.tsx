// src/app/admin/states/new/page.tsx
'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import StateForm from '../state-form';
import { createState, type StateFormData } from '../actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NewStatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSave = () => {
    formRef.current?.requestSubmit();
  };
  
  async function handleCreateState(data: StateFormData) {
    setIsSubmitting(true);
    const result = await createState(data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Estado criado.' });
      router.push('/admin/states');
    } else {
      toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  }

  return (
    <FormPageLayout
        formTitle="Novo Estado"
        formDescription="Preencha os detalhes para cadastrar um novo estado."
        icon={MapPin}
        isViewMode={false}
        isSubmitting={isSubmitting}
        onSave={handleSave}
        onCancel={() => router.push('/admin/states')}
    >
        <StateForm
            ref={formRef}
            onSubmitAction={handleCreateState}
        />
    </FormPageLayout>
  );
}
