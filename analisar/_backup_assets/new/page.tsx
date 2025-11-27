// src/app/admin/assets/new/page.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AssetFormData, LotCategory, JudicialProcess, SellerProfileInfo, StateInfo, CityInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { createAsset } from '../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import AssetForm from '../asset-form';
import { Package, Loader2 } from 'lucide-react';

export default function NewAssetPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dependencies, setDependencies] = useState<{
    processes: JudicialProcess[],
    categories: LotCategory[],
    sellers: SellerProfileInfo[],
    allStates: StateInfo[],
    allCities: CityInfo[],
  } | null>(null);

  const formRef = React.useRef<any>(null);

  const fetchPageData = useCallback(async () => {
    try {
      const [processes, categories, sellers, states, cities] = await Promise.all([
        getJudicialProcesses(),
        getLotCategories(),
        getSellers(),
        getStates(),
        getCities(),
      ]);
      setDependencies({ processes, categories, sellers, allStates: states, allCities: cities });
    } catch (e) {
      console.error("Failed to load data for new asset page:", e);
      toast({ title: 'Erro ao Carregar', description: 'Não foi possível buscar os dados necessários para criar um ativo.', variant: 'destructive'});
    }
  }, [toast]);
  
  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  
  const handleCreate = async (data: AssetFormData) => {
    setIsSubmitting(true);
    const result = await createAsset(data);
    if (result.success && result.assetId) {
      toast({ title: 'Sucesso', description: 'Ativo criado com sucesso.' });
      router.push(`/admin/assets/${result.assetId}/edit`);
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive' });
      setIsSubmitting(false);
    }
    return result;
  };

  const handleSave = () => {
    formRef.current?.requestSubmit();
  };
  
  const isLoading = !dependencies;

  return (
    <FormPageLayout
      formTitle="Novo Ativo"
      formDescription="Cadastre um novo bem que poderá ser futuramente vinculado a um lote."
      icon={Package}
      isViewMode={false}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      isValid={formRef.current?.formState.isValid ?? false}
      onSave={handleSave}
      onCancel={() => router.push('/admin/assets')}
    >
      {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
         <AssetForm
            ref={formRef}
            processes={dependencies.processes}
            categories={dependencies.categories}
            sellers={dependencies.sellers}
            allStates={dependencies.allStates}
            allCities={dependencies.allCities}
            onSubmitAction={handleCreate}
            onSuccess={(assetId) => { if(assetId) router.push(`/admin/assets/${assetId}/edit`); }}
            onCancel={() => router.push('/admin/assets')}
          />
      )}
    </FormPageLayout>
  );
}

