// src/app/admin/judicial-branches/[branchId]/edit/page.tsx
'use client';

import JudicialBranchForm from '../../judicial-branch-form';
import { getJudicialBranch, updateJudicialBranch, deleteJudicialBranch, type JudicialBranchFormData } from '../../actions';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';
import { notFound, useParams, useRouter } from 'next/navigation';
import FormPageLayout from '@/components/admin/form-page-layout';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Building2 } from 'lucide-react';
import type { JudicialBranch, JudicialDistrict } from '@/types';

export default function EditJudicialBranchPage() {
  const params = useParams();
  const branchId = params.branchId as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [branch, setBranch] = useState<JudicialBranch | null>(null);
  const [districts, setDistricts] = useState<JudicialDistrict[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);
  const formRef = useRef<any>(null);

  const fetchPageData = useCallback(async () => {
    if (!branchId) return;
    setIsLoading(true);
    try {
        const [fetchedBranch, fetchedDistricts] = await Promise.all([
            getJudicialBranch(branchId),
            getJudicialDistricts()
        ]);
        if (!fetchedBranch) {
            notFound();
            return;
        }
        setBranch(fetchedBranch);
        setDistricts(fetchedDistricts);
    } catch(e) {
        console.error("Failed to fetch branch data", e);
        toast({title: "Erro", description: "Falha ao buscar dados da vara.", variant: "destructive"})
    }
    setIsLoading(false);
  }, [branchId, toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  
  const handleFormSubmit = async (data: JudicialBranchFormData) => {
    setIsSubmitting(true);
    const result = await updateJudicialBranch(branchId, data);
    if (result.success) {
        toast({ title: 'Sucesso!', description: 'Vara atualizada.' });
        fetchPageData();
        setIsViewMode(true);
    } else {
        toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    const result = await deleteJudicialBranch(branchId);
     if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/judicial-branches');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  }

  const handleSave = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <FormPageLayout
        formTitle={isViewMode ? "Visualizar Vara" : "Editar Vara"}
        formDescription={branch?.name || 'Carregando...'}
        icon={Building2}
        isViewMode={isViewMode}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        onEnterEditMode={() => setIsViewMode(false)}
        onCancel={() => setIsViewMode(true)}
        onSave={handleSave}
        onDelete={handleDelete}
    >
        <JudicialBranchForm
            ref={formRef}
            initialData={branch}
            districts={districts}
            onSubmitAction={handleFormSubmit}
        />
    </FormPageLayout>
  );
}
