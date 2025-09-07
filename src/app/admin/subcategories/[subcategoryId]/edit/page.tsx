// src/app/admin/subcategories/[subcategoryId]/edit/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
import SubcategoryForm from '../../subcategory-form';
import { getSubcategoryByIdAction, updateSubcategoryAction, deleteSubcategoryAction } from '../../actions';
import type { SubcategoryFormData } from '../../subcategory-form-schema';
import { getLotCategories } from '@/app/admin/categories/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { useToast } from '@/hooks/use-toast';
import { Layers } from 'lucide-react';
import type { Subcategory, LotCategory } from '@/types';

export default function EditSubcategoryPage() {
  const params = useParams();
  const subcategoryId = params.subcategoryId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [parentCategories, setParentCategories] = useState<LotCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);
  const formRef = useRef<any>(null);
  
  const fetchPageData = useCallback(async () => {
    if (!subcategoryId) return;
    setIsLoading(true);
    try {
      const [fetchedSubcat, fetchedCats] = await Promise.all([
        getSubcategoryByIdAction(subcategoryId),
        getLotCategories(),
      ]);

      if (!fetchedSubcat) {
        notFound();
        return;
      }
      setSubcategory(fetchedSubcat);
      setParentCategories(fetchedCats);
    } catch (e) {
      console.error("Failed to fetch subcategory data:", e);
      toast({ title: "Erro", description: "Falha ao buscar dados da subcategoria.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [subcategoryId, toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleFormSubmit = async (data: Partial<SubcategoryFormData>) => {
    setIsSubmitting(true);
    const result = await updateSubcategoryAction(subcategoryId, data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Subcategoria atualizada.' });
      fetchPageData();
      setIsViewMode(true);
    } else {
      toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };
  
  const handleDelete = async () => {
    const result = await deleteSubcategoryAction(subcategoryId);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/subcategories');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  };
  
  const handleSave = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <FormPageLayout
      formTitle={isViewMode ? "Visualizar Subcategoria" : "Editar Subcategoria"}
      formDescription={subcategory?.name || 'Carregando...'}
      icon={Layers}
      isViewMode={isViewMode}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onEnterEditMode={() => setIsViewMode(false)}
      onCancel={() => setIsViewMode(true)}
      onSave={handleSave}
      onDelete={handleDelete}
    >
      <SubcategoryForm
        ref={formRef}
        initialData={subcategory}
        parentCategories={parentCategories}
        onSubmitAction={handleFormSubmit}
      />
    </FormPageLayout>
  );
}
