// src/app/admin/categories/[categoryId]/edit/page.tsx
'use client';

import CategoryForm from '../../category-form';
import { getLotCategory, updateLotCategory, deleteLotCategory, type CategoryFormData } from '../../actions';
import { notFound, useRouter, useParams } from 'next/navigation';
import FormPageLayout from '@/components/admin/form-page-layout';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Tag } from 'lucide-react';

export default function EditCategoryPage() {
  const params = useParams();
  const categoryId = params.categoryId as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [category, setCategory] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);
  const formRef = useRef<any>(null);

  const fetchPageData = useCallback(async () => {
    if (!categoryId) return;
    setIsLoading(true);
    try {
        const fetchedCategory = await getLotCategory(categoryId);
        if (!fetchedCategory) {
            notFound();
            return;
        }
        setCategory(fetchedCategory);
    } catch(e) {
        console.error("Failed to fetch category", e);
        toast({title: "Erro", description: "Falha ao buscar dados da categoria.", variant: "destructive"})
    }
    setIsLoading(false);
  }, [categoryId, toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  
  const handleFormSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    const result = await updateLotCategory(categoryId, data as Partial<Pick<any, "name" | "description">>);
    if (result.success) {
        toast({ title: 'Sucesso!', description: 'Categoria atualizada.' });
        fetchPageData();
        setIsViewMode(true);
    } else {
        toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };
  
  const handleDelete = async () => {
    const result = await deleteLotCategory(categoryId);
     if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/categories');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  }

  const handleSave = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <FormPageLayout
        formTitle={isViewMode ? "Visualizar Categoria" : "Editar Categoria"}
        formDescription={category?.name || 'Carregando...'}
        icon={Tag}
        isViewMode={isViewMode}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        onEnterEditMode={() => setIsViewMode(false)}
        onCancel={() => setIsViewMode(true)}
        onSave={handleSave}
        onDelete={handleDelete}
    >
        <CategoryForm
            ref={formRef}
            initialData={category}
            onSubmitAction={handleFormSubmit}
        />
    </FormPageLayout>
  );
}
