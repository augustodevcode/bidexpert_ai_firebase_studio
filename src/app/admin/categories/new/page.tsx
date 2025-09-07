// src/app/admin/categories/new/page.tsx
'use client';

import CategoryForm from '../category-form';
import { createLotCategory } from '../actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Tag } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function NewCategoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = () => {
    formRef.current?.requestSubmit();
  }

  async function handleCreateCategory(data: any) {
    setIsSubmitting(true);
    const result = await createLotCategory(data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Categoria criada.' });
      router.push('/admin/categories');
    } else {
      toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
      setIsSubmitting(false);
    }
  }

  return (
    <FormPageLayout
        formTitle="Nova Categoria de Lote"
        formDescription="Preencha os detalhes para criar uma nova categoria."
        icon={Tag}
        isViewMode={false} // Always in edit mode
        isSubmitting={isSubmitting}
        onSave={handleSave}
        onCancel={() => router.push('/admin/categories')}
    >
        <CategoryForm
            ref={formRef}
            onSubmitAction={handleCreateCategory}
        />
    </FormPageLayout>
  );
}
