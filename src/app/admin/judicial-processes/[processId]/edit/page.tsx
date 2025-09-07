// src/app/admin/judicial-processes/[processId]/edit/page.tsx
'use client';

import JudicialProcessForm from '../../judicial-process-form';
import { getJudicialProcess, updateJudicialProcessAction, deleteJudicialProcess, type JudicialProcessFormValues } from '../../actions';
import { getCourts } from '@/app/admin/courts/actions';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { notFound, useParams, useRouter } from 'next/navigation';
import type { JudicialProcess, Court, JudicialDistrict, JudicialBranch, SellerProfileInfo } from '@/types';
import FormPageLayout from '@/components/admin/form-page-layout';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Gavel } from 'lucide-react';

export default function EditJudicialProcessPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const processId = params.processId as string;
  
  const [processData, setProcessData] = useState<JudicialProcess | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [districts, setDistricts] = useState<JudicialDistrict[]>([]);
  const [branches, setBranches] = useState<JudicialBranch[]>([]);
  const [sellers, setSellers] = useState<SellerProfileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);
  const formRef = useRef<any>(null);

  const fetchPageData = useCallback(async () => {
    if (!processId) return;
    setIsLoading(true);
    try {
      const [fetchedProcess, fetchedCourts, fetchedDistricts, fetchedBranches, fetchedSellers] = await Promise.all([
        getJudicialProcess(processId),
        getCourts(),
        getJudicialDistricts(),
        getJudicialBranches(),
        getSellers()
      ]);

      if (!fetchedProcess) {
        notFound();
        return;
      }
      setProcessData(fetchedProcess);
      setCourts(fetchedCourts);
      setDistricts(fetchedDistricts);
      setBranches(fetchedBranches);
      setSellers(fetchedSellers);
    } catch (e) {
      console.error("Failed to fetch judicial process data:", e);
      toast({ title: "Erro", description: "Falha ao buscar dados do processo.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [processId, toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  
  const handleFormSubmit = async (data: JudicialProcessFormValues) => {
    setIsSubmitting(true);
    const result = await updateJudicialProcessAction(processId, data);
    if (result.success) {
        toast({ title: 'Sucesso!', description: 'Processo atualizado.' });
        fetchPageData(); // Re-fetch to get latest data
        setIsViewMode(true);
    } else {
        toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };
  
  const handleDelete = async () => {
    const result = await deleteJudicialProcess(processId);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/judicial-processes');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  };
  
  const handleSave = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <FormPageLayout
      formTitle={isViewMode ? "Visualizar Processo" : "Editar Processo"}
      formDescription={processData?.processNumber || 'Carregando...'}
      icon={Gavel}
      isViewMode={isViewMode}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onEnterEditMode={() => setIsViewMode(false)}
      onCancel={() => setIsViewMode(true)}
      onSave={handleSave}
      onDelete={handleDelete}
    >
      <JudicialProcessForm
        ref={formRef}
        initialData={processData}
        courts={courts}
        allDistricts={districts}
        allBranches={branches}
        sellers={sellers}
        onSubmitAction={handleFormSubmit}
      />
    </FormPageLayout>
  );
}
